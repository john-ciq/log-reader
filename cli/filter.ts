/**
 * Full View CLI — apply saved filters to log files and export a single merged JSON.
 *
 * Usage:
 *   fv -i file1.log -i file2.log -c full-view-config.json
 *   cat file.log | fv -c full-view-config.json
 *
 * The config file is exported from the app via Filters & Search → ⬇ Export.
 * When --output is omitted the JSON is written to stdout.
 */

import * as fs from 'fs';
import * as path from 'path';
import JSZip from 'jszip';
import { parseLogContent, parseLogLine, LogEntry } from '../src/lib/parser.ts';
import { FilterConfig, getFilterDecision, searchEntries, regexSearchEntries } from '../src/lib/filters.ts';

// ── Types ──────────────────────────────────────────────────────────────────────

interface FilterExport {
  version: number;
  filters: FilterConfig[];
  search: { query: string; useRegex: boolean };
}

interface Args {
  files: string[];
  configFile: string | null;
  outputFile: string | null;  // null = stdout
}

// ── Logging — always to stderr so stdout stays clean for JSON ─────────────────

const log  = (...args: unknown[]) => process.stderr.write(args.join(' ') + '\n');
const warn = (...args: unknown[]) => process.stderr.write('[warn] ' + args.join(' ') + '\n');

// ── Argument parsing ───────────────────────────────────────────────────────────

function parseArgs(argv: string[]): Args {
  const args = argv.slice(2);
  const files: string[] = [];
  let configFile: string | null = null;
  let outputFile: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if ((a === '--input' || a === '-i') && args[i + 1]) {
      files.push(args[++i]);
    } else if ((a === '--config' || a === '-c') && args[i + 1]) {
      configFile = args[++i];
    } else if ((a === '--output' || a === '-o') && args[i + 1]) {
      outputFile = args[++i];
    } else if (a === '--help' || a === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return { files, configFile, outputFile };
}

function printHelp(): void {
  process.stdout.write(`
Full View CLI — filter log files and export a merged, timestamp-sorted JSON

Usage:
  fv [options]

Options:
  -i, --input  <file>   Log file to process (repeat for multiple files)
  -c, --config <file>   Path to a Full View filters export (⬇ Export in the app).
                        Auto-detects full-view-config*.json in the current directory.
  -o, --output <file>   Output file. Omit to write JSON to stdout.
  -h, --help            Show this help

  Log content can also be piped via stdin (combined with -i files if needed).

Examples:
  fv -i app.log -i service.log -c full-view-config.json
  fv -i app.log -c config.json -o results.json
  fv -i app.log | jq '.[0]'
  cat app.log | fv -c config.json
  cat app.log | fv -i service.log -c config.json
\n`);
}

// ── Config helpers ─────────────────────────────────────────────────────────────

function loadConfig(file: string): FilterExport {
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as FilterExport;
}

function autoDetectConfig(): string | null {
  const candidates = fs.readdirSync('.').filter(f => f.startsWith('full-view-config') && f.endsWith('.json'));
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
}

// ── Stdin ──────────────────────────────────────────────────────────────────────

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

// ── ZIP processing ─────────────────────────────────────────────────────────────

async function processZip(
  buffer: Buffer,
  zipName: string,
): Promise<{ entries: LogEntry[]; count: number }> {
  const zip = await JSZip.loadAsync(buffer);

  // Central Logger archive (has log_state.json + logN.json files)
  if (zip.files['log_state.json']) {
    let allEntries: LogEntry[] = [];
    let idx = 0;
    const logFiles = Object.keys(zip.files)
      .filter(f => !zip.files[f].dir && f !== 'log_state.json' && f.endsWith('.json'));

    for (const filename of logFiles) {
      const name = path.basename(filename);
      const content = await zip.files[filename].async('string');
      const jsonData = JSON.parse(content);

      let rawEntries: unknown[];
      if (Array.isArray(jsonData)) {
        rawEntries = jsonData;
      } else if (typeof jsonData === 'object' && jsonData !== null) {
        const nested = Object.values(jsonData).find(Array.isArray);
        if (!nested) { warn(`${zipName}/${name}: no array found, skipping`); continue; }
        rawEntries = nested as unknown[];
      } else {
        warn(`${zipName}/${name}: unexpected format, skipping`);
        continue;
      }

      let fileEntries = 0;
      for (const entry of rawEntries) {
        const parsed = parseLogLine(JSON.stringify(entry), `zip-${idx++}`, name);
        if (parsed) { allEntries.push(parsed); fileEntries++; }
      }
      log(`  ${zipName}/${name}: ${fileEntries} entries`);
    }
    log(`  ${zipName}: ${allEntries.length} total entries`);
    return { entries: allEntries, count: allEntries.length };
  }

  // Generic ZIP — process each file, recurse into nested ZIPs
  let allEntries: LogEntry[] = [];
  let total = 0;

  const fileList = Object.values(zip.files).filter(f => !f.dir);
  for (const file of fileList) {
    const name = path.basename(file.name);
    if (name.endsWith('.zip')) {
      const nested = Buffer.from(await file.async('arraybuffer'));
      const result = await processZip(nested, name);
      allEntries = allEntries.concat(result.entries);
      total += result.count;
    } else {
      const content = await file.async('string');
      const entries = parseLogContent(content, name);
      log(`  ${zipName}/${name}: ${entries.length} entries`);
      total += entries.length;
      allEntries = allEntries.concat(entries);
    }
  }

  return { entries: allEntries, count: total };
}

// ── Filtering ──────────────────────────────────────────────────────────────────

function applyFilterChain(entries: LogEntry[], filters: FilterConfig[]): LogEntry[] {
  const enabled = filters.filter(f => f.enabled);
  if (enabled.length === 0) return entries;

  return entries.filter(entry => {
    for (const filter of enabled) {
      const decision = getFilterDecision(entry, filter);
      if (decision !== null) return decision;
    }
    return true;
  });
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { files, configFile, outputFile } = parseArgs(process.argv);
  const hasStdin = process.stdin.isTTY === false;

  if (files.length === 0 && !hasStdin) {
    printHelp();
    process.exit(1);
  }

  // Load config
  let filters: FilterConfig[] = [];
  let search = { query: '', useRegex: false };

  const resolvedConfig = configFile ?? autoDetectConfig();

  if (resolvedConfig) {
    log(`Config: ${path.resolve(resolvedConfig)}`);
    const config = loadConfig(resolvedConfig);
    filters = (config.filters ?? []).map(f => ({ ...f, enabled: f.enabled ?? true }));
    search = config.search ?? { query: '', useRegex: false };

    const active = filters.filter(f => f.enabled);
    if (active.length) log(`  Filters : ${active.length} active${filters.length > active.length ? ` (${filters.length - active.length} disabled)` : ''}`);
    if (search.query)  log(`  Search  : "${search.query}"${search.useRegex ? ' (regex)' : ''}`);
  } else {
    log('No config file — merging all parsed entries without filtering.');
  }

  // Parse all input files
  let allEntries: LogEntry[] = [];
  let totalParsed = 0;
  let sourceCount = 0;

  if (hasStdin) {
    const content = await readStdin();
    const entries = parseLogContent(content, '<stdin>');
    log(`  <stdin>: ${entries.length} entries`);
    totalParsed += entries.length;
    allEntries = allEntries.concat(entries);
    sourceCount++;
  }

  for (const filePath of files) {
    if (!fs.existsSync(filePath)) {
      warn(`not found: ${filePath}`);
      continue;
    }
    const filename = path.basename(filePath);
    if (filename.endsWith('.zip')) {
      const result = await processZip(fs.readFileSync(filePath), filename);
      allEntries = allEntries.concat(result.entries);
      totalParsed += result.count;
    } else {
      const entries = parseLogContent(fs.readFileSync(filePath, 'utf-8'), filename);
      log(`  ${filename}: ${entries.length} entries`);
      totalParsed += entries.length;
      allEntries = allEntries.concat(entries);
    }
    sourceCount++;
  }

  log(`\nParsed: ${totalParsed} entries across ${sourceCount} source(s)`);

  // Sort by timestamp
  allEntries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Apply filters
  allEntries = applyFilterChain(allEntries, filters);

  // Apply search
  if (search.query) {
    allEntries = search.useRegex
      ? regexSearchEntries(allEntries, search.query)
      : searchEntries(allEntries, search.query);
  }

  log(`After filtering: ${allEntries.length} entries`);

  // Output
  const json = JSON.stringify(allEntries, null, 2);

  if (outputFile) {
    fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true });
    fs.writeFileSync(outputFile, json, 'utf-8');
    log(`\nSaved: ${path.resolve(outputFile)}`);
  } else {
    process.stdout.write(json + '\n');
  }
}

main().catch(err => { process.stderr.write(`Error: ${err.message}\n`); process.exit(1); });
