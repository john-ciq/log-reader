import { useState, ReactNode } from 'react';

interface MessageCellProps {
  message: string;
  searchQuery?: string;
  useRegex?: boolean;
}

function highlightText(text: string, query: string, useRegex: boolean): ReactNode {
  if (!query) return text;
  try {
    const pattern = useRegex
      ? new RegExp(query, 'gi')
      : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const parts: ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
      parts.push(<mark key={match.index} className="search-highlight">{match[0]}</mark>);
      lastIndex = match.index + match[0].length;
      if (match[0].length === 0) pattern.lastIndex++;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts.length ? parts : text;
  } catch {
    return text;
  }
}

interface JsonExtraction {
  before: string;
  json: unknown;
  after: string;
}

// Attempt to coerce a JavaScript-style object literal into valid JSON.
// Handles unquoted keys, single-quoted strings, and `undefined` values.
function normalizeToJson(str: string): string {
  return str
    .replace(/([\{,]\s*)(\w+)\s*:/g, '$1"$2":')   // quote unquoted keys
    .replace(/:\s*'([^']*)'/g, ': "$1"')            // single-quoted → double-quoted strings
    .replace(/:\s*undefined\b/g, ': null');          // undefined → null
}

// attempt to locate and parse the first JSON object/array in the message
function extractJson(text: string): JsonExtraction | null {
  let searchFrom = 0;

  while (searchFrom < text.length) {
    const relIdx = text.slice(searchFrom).search(/[\{\[]/);
    if (relIdx === -1) return null;

    const startIdx = searchFrom + relIdx;
    const openChar = text[startIdx];
    const closeChar = openChar === '{' ? '}' : ']';
    let depth = 0;
    let endIdx = -1;

    for (let i = startIdx; i < text.length; i++) {
      const ch = text[i];
      if (ch === openChar) depth++;
      else if (ch === closeChar) {
        depth--;
        if (depth === 0) { endIdx = i; break; }
      }
    }

    if (endIdx === -1) return null; // unbalanced — give up

    const rawStr = text.slice(startIdx, endIdx + 1);
    const before = text.slice(0, startIdx);
    const after = text.slice(endIdx + 1);

    // Try strict JSON first, then fall back to JS-object notation
    for (const candidate of [rawStr, normalizeToJson(rawStr)]) {
      try {
        const parsed = JSON.parse(candidate);
        return { before, json: parsed, after };
      } catch {
        // try next candidate
      }
    }

    // Neither parse succeeded — advance past this bracket group and keep searching
    searchFrom = endIdx + 1;
  }

  return null;
}

// simple recursive renderer for JSON data
function JsonTree({ data }: { data: any }) {
  if (data === null || typeof data !== 'object') {
    return <span className="json-primitive">{String(data)}</span>;
  }

  if (Array.isArray(data)) {
    return (
      <div className="json-array">
        [
        {data.map((item, idx) => (
          <div key={idx} className="json-node">
            <JsonTree data={item} />
          </div>
        ))}
        ]
      </div>
    );
  }

  return (
    <div className="json-object">
      {'{'}
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="json-node">
          <strong>{key}</strong>: <JsonTree data={value} />
        </div>
      ))}
      {'}'}
    </div>
  );
}

const PREVIEW_CHARS = 300;

export default function MessageCell({ message, searchQuery = '', useRegex = false }: MessageCellProps) {
  const [jsonExpanded, setJsonExpanded] = useState(false);
  const [textExpanded, setTextExpanded] = useState(false);

  const isLong = message.length > PREVIEW_CHARS;

  // When collapsed, show a plain-text truncated preview
  if (isLong && !textExpanded) {
    const preview = message.slice(0, PREVIEW_CHARS);
    return (
      <span>
        {highlightText(preview, searchQuery, useRegex)}
        <span className="message-ellipsis">…</span>
        <button className="message-expand-btn" onClick={() => setTextExpanded(true)}>show more</button>
      </span>
    );
  }

  const extraction = extractJson(message);

  const collapseOnDoubleClick = isLong ? (e: React.MouseEvent) => {
    if (e.detail === 2) setTextExpanded(false);
  } : undefined;

  if (extraction) {
    const { before, json, after } = extraction;
    return (
      <div className="message-json" onClick={collapseOnDoubleClick}>
        {before && <span className="json-before">{highlightText(before, searchQuery, useRegex)}</span>}
        <button
          className="json-toggle"
          onClick={(e) => { e.stopPropagation(); setJsonExpanded((v) => !v); }}
          aria-label={jsonExpanded ? 'Collapse JSON' : 'Expand JSON'}
        >
          {jsonExpanded ? '▼' : '▶'}
        </button>
        {after && <span className="json-after">{highlightText(after, searchQuery, useRegex)}</span>}
        {jsonExpanded && <div className="json-tree"><JsonTree data={json} /></div>}
        {isLong && (
          <button className="message-expand-btn" onClick={(e) => { e.stopPropagation(); setTextExpanded(false); }}>show less</button>
        )}
      </div>
    );
  }

  return (
    <span onClick={collapseOnDoubleClick}>
      {highlightText(message, searchQuery, useRegex)}
      {isLong && (
        <button className="message-expand-btn" onClick={(e) => { e.stopPropagation(); setTextExpanded(false); }}>show less</button>
      )}
    </span>
  );
}
