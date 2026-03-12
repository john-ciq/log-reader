import { useState, useMemo, useRef, useEffect } from 'react';

interface RawFileViewerProps {
  content: string;
}

interface MatchRange {
  start: number;
  end: number;
}

function findMatches(text: string, query: string, useRegex: boolean): MatchRange[] {
  if (!query) return [];
  try {
    const pattern = useRegex
      ? new RegExp(query, 'gi')
      : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches: MatchRange[] = [];
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length });
      if (match[0].length === 0) pattern.lastIndex++;
    }
    return matches;
  } catch {
    return [];
  }
}

export default function RawFileViewer({ content }: RawFileViewerProps) {
  const [wrap, setWrap] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const preRef = useRef<HTMLPreElement>(null);

  const matches = useMemo(
    () => findMatches(content, searchInput, useRegex),
    [content, searchInput, useRegex]
  );

  // Reset to first match when query changes
  useEffect(() => {
    setCurrentMatchIdx(0);
  }, [searchInput, useRegex]);

  // Scroll current match into view after render
  useEffect(() => {
    if (!preRef.current || matches.length === 0) return;
    const el = preRef.current.querySelector('.raw-highlight-current');
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentMatchIdx, matches]);

  const handleFind = () => {
    if (matches.length === 0) return;
    setCurrentMatchIdx(prev => (prev + 1) % matches.length);
  };

  const renderedContent = useMemo(() => {
    if (!searchInput || matches.length === 0) return content;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((m, idx) => {
      if (m.start > lastIndex) parts.push(content.slice(lastIndex, m.start));
      parts.push(
        <mark
          key={idx}
          className={idx === currentMatchIdx ? 'raw-highlight raw-highlight-current' : 'raw-highlight'}
        >
          {content.slice(m.start, m.end)}
        </mark>
      );
      lastIndex = m.end;
    });

    if (lastIndex < content.length) parts.push(content.slice(lastIndex));
    return parts;
  }, [content, matches, currentMatchIdx, searchInput]);

  return (
    <div className="raw-file-viewer">
      <div className="raw-file-toolbar">
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleFind()}
          placeholder="Find in file…"
          className="raw-file-search-input"
        />
        <button
          onClick={handleFind}
          className="raw-file-find-btn"
          disabled={matches.length === 0}
        >
          Find
        </button>
        <button
          onClick={() => setUseRegex(r => !r)}
          className={`raw-file-regex-btn${useRegex ? ' active' : ''}`}
          title="Toggle regular expression"
        >
          .*
        </button>
        <span className="raw-file-match-count">
          {searchInput
            ? matches.length === 0
              ? 'No matches'
              : `${currentMatchIdx + 1} of ${matches.length}`
            : ''}
        </span>
        <label className="raw-file-wrap-toggle">
          <input
            type="checkbox"
            checked={wrap}
            onChange={e => setWrap(e.target.checked)}
          />
          Wrap
        </label>
      </div>
      <div className="raw-file-scroll">
        <pre
          ref={preRef}
          className="raw-file-content"
          style={{ whiteSpace: wrap ? 'pre-wrap' : 'pre' }}
        >
          {renderedContent}
        </pre>
      </div>
    </div>
  );
}
