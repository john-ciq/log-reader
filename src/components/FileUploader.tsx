import { useState, useRef } from 'react';
import { parseLogContent, parseLogLine, LogEntry } from '../lib/parser';
import JSZip from 'jszip';
import { storage } from '../lib/local-storage';

export interface RawFile {
  id: string;
  name: string;
  content: string;
  children?: Array<{ name: string; content: string }>;
}

interface FileUploaderProps {
  onUpload: (entries: LogEntry[]) => void;
  onRawFiles: (files: RawFile[]) => void;
}

async function processZipFile(file: File): Promise<{ entries: LogEntry[]; rawChildren: Array<{ name: string; content: string }> }> {
  const zip = new JSZip();
  const zipData = await file.arrayBuffer();
  const extractedZip = await zip.loadAsync(zipData);

  let allEntries: LogEntry[] = [];
  const rawChildren: Array<{ name: string; content: string }> = [];
  const timestamp = Date.now();

  const isCentralLoggerArchive = 'log_state.json' in extractedZip.files;

  if (isCentralLoggerArchive) {
  // Known format: JSON log files alongside log_state.json
    for (const [filename, fileObj] of Object.entries(extractedZip.files)) {
      if (fileObj.dir || filename === 'log_state.json' || !filename.endsWith('.json')) {
        continue;
      }

      try {
        const fileContent = await fileObj.async('text');
        rawChildren.push({ name: filename, content: fileContent });

        const jsonData = JSON.parse(fileContent);

        let entries: unknown[];
        let nestedKey: string | undefined;
        if (Array.isArray(jsonData)) {
          entries = jsonData;
        } else if (typeof jsonData === 'object' && jsonData !== null) {
          nestedKey = Object.keys(jsonData).find(k => Array.isArray((jsonData as Record<string, unknown>)[k]));
          if (!nestedKey) {
            console.warn(`Warning: ${filename} contains no array to parse`);
            continue;
          }
          entries = (jsonData as Record<string, unknown>)[nestedKey] as unknown[];
        } else {
          console.warn(`Warning: ${filename} is not a JSON array or object`);
          continue;
        }

        // RawFileViewer pretty-prints JSON, so line numbers must be calculated
        // against the pretty-printed content, not the raw single-line file.
        const prettyContent = JSON.stringify(jsonData, null, 2);
        const prettyArrayStartOffset = nestedKey
          ? prettyContent.indexOf('[', prettyContent.indexOf(`"${nestedKey}"`))
          : prettyContent.indexOf('[');

        // Walk the pretty-printed content tracking JSON depth to find the line
        // number of each top-level entry object (depth 2 opening '{').
        const entryLineNumbers: number[] = [];
        let depth = 0;
        let inString = false;
        let escape = false;
        let currentLine = prettyContent.slice(0, prettyArrayStartOffset).split('\n').length;
        for (let i = prettyArrayStartOffset; i < prettyContent.length; i++) {
          const ch = prettyContent[i];
          if (ch === '\n') { currentLine++; continue; }
          if (escape) { escape = false; continue; }
          if (ch === '\\' && inString) { escape = true; continue; }
          if (ch === '"') { inString = !inString; continue; }
          if (inString) continue;
          if (ch === '[' || ch === '{') {
            depth++;
            if (depth === 2 && ch === '{') entryLineNumbers.push(currentLine);
          } else if (ch === ']' || ch === '}') {
            depth--;
            if (depth === 0) break;
          }
        }

        entries.forEach((entry, idx) => {
          const id = `${timestamp}-${allEntries.length}-${idx}`;
          const jsonStr = JSON.stringify(entry);
          const parsed = parseLogLine(jsonStr, id, filename);
          if (parsed) {
            const lineNumber = entryLineNumbers[idx] ?? 1;
            allEntries.push({ ...parsed, lineNumberStart: lineNumber, lineNumberEnd: lineNumber });
          }
        });
      } catch (err) {
        console.error(`Error processing ${filename}:`, err);
      }
    }
  } else {
    // Generic ZIP: process each file the same way as a normal upload
    for (const [filename, fileObj] of Object.entries(extractedZip.files)) {
      if (fileObj.dir) continue;
      try {
        if (filename.endsWith('.zip')) {
          const nestedBuffer = await fileObj.async('arraybuffer');
          const nestedFile = new File([nestedBuffer], filename, { type: 'application/zip' });
          const { entries: nestedEntries, rawChildren: nestedChildren } = await processZipFile(nestedFile);
          allEntries = allEntries.concat(nestedEntries);
          rawChildren.push(...nestedChildren);
        } else {
          const content = await fileObj.async('text');
          rawChildren.push({ name: filename, content });
          const entries = parseLogContent(content, filename);
          allEntries = allEntries.concat(entries);
        }
      } catch (err) {
        console.error(`Error processing ${filename}:`, err);
      }
    }
  }

  return { entries: allEntries, rawChildren };
}

export default function FileUploader({ onUpload, onRawFiles }: FileUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(() => storage.loadPanelCollapsed('uploader'));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      let allEntries: LogEntry[] = [];
      const rawFilesToAdd: RawFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = `${Date.now()}-${i}`;

        if (file.name.endsWith('.zip')) {
          const { entries, rawChildren } = await processZipFile(file);
          allEntries = allEntries.concat(entries);
          rawFilesToAdd.push({ id: fileId, name: file.name, content: '', children: rawChildren });
        } else {
          const content = await file.text();
          const entries = parseLogContent(content, file.name);
          allEntries = allEntries.concat(entries);
          rawFilesToAdd.push({ id: fileId, name: file.name, content });
        }
      }

      if (rawFilesToAdd.length > 0) {
        onRawFiles(rawFilesToAdd);
      }

      if (allEntries.length === 0) {
        setError('No valid log entries found in selected file(s)');
        return;
      }

      onUpload(allEntries);
    } catch (err) {
      setError(`Failed to read file(s): ${(err as Error).message}`);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        for (let i = 0; i < files.length; i++) {
          dataTransfer.items.add(files[i]);
        }
        fileInputRef.current.files = dataTransfer.files;
        const event = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(event);
      }
    }
  };

  const handleClick = () => {
    if (!loading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="file-uploader">
      <h3 className="collapsible-heading" onClick={() => setCollapsed(c => { storage.savePanelCollapsed('uploader', !c); return !c; })}>
        <span className="collapse-arrow">{collapsed ? '▶' : '▼'}</span>
        📁 Upload Log File(s)
        {collapsed && (
          <button
            className="uploader-browse-btn"
            onClick={e => { e.stopPropagation(); handleClick(); }}
            disabled={loading}
          >Browse</button>
        )}
      </h3>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        disabled={loading}
        className="file-input"
        accept=".log,.txt,.zip,.json"
        multiple
      />

      {!collapsed && (
        <>
          <div
            className="upload-area"
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >

            {loading ? (
              <p className="upload-text">Loading...</p>
            ) : (
              <>
                <p className="upload-text">📤 Drag & drop log file(s) here</p>
                <p className="upload-hint">or click to browse</p>
              </>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}
        </>
      )}
    </div>
  );
}
