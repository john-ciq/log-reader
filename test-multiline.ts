import fs from 'fs';
import { parseLogContent } from './src/lib/parser.ts';

const content = fs.readFileSync('sample-logs/FEA-2026-03-11.log','utf8');
const entries = parseLogContent(content,'FEA-2026-03-11.log');
console.log('entries', entries.length);
console.log('first two entries:', entries.slice(0,2).map(e=> ({timestamp:e.timestamp,level:e.level, message:e.message.substring(0,100)})));
console.log('second full message:');
console.log(entries[1].message);

const jsonIdx = entries.findIndex(e => e.message.includes('{"') || e.message.includes('{\n'));
console.log('json-containing entry index', jsonIdx);
if (jsonIdx >= 0) {
  console.log('json entry message start:', entries[jsonIdx].message.substring(0,200));
}
