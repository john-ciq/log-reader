#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

const root   = path.join(__dirname, '..');
const tsx    = path.join(root, 'node_modules', '.bin', 'tsx');
const script = path.join(__dirname, 'filter.ts');

const result = spawnSync(
  process.platform === 'win32' ? tsx + '.cmd' : tsx,
  [script, ...process.argv.slice(2)],
  { stdio: 'inherit', cwd: process.cwd(), shell: process.platform === 'win32' }
);

process.exit(result.status ?? 0);
