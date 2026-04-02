import { useState, useMemo, useRef, useEffect } from 'react';
import { useFeatures } from '../lib/FeaturesContext';

interface RawFileViewerProps {
  content: string;
  scrollToLine?: number;
  scrollToLineEnd?: number;
  onScrolled?: () => void;
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

export default function RawFileViewer({ content, scrollToLine, scrollToLineEnd, onScrolled }: RawFileViewerProps) {
  const { features } = useFeatures();
  const [wrap, setWrap] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const preRef = useRef<HTMLPreElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lineHeightRef = useRef(0);
  const paddingTopRef = useRef(0);
  const [highlightLines, setHighlightLines] = useState<{ start: number; end: number } | null>(null);

  // Pretty-print JSON content to avoid single-line files that are millions of pixels wide
  const displayContent = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  }, [content]);

  // Debounce search input by 250ms before running matches
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const matches = useMemo(
    () => findMatches(displayContent, debouncedSearch, useRegex),
    [displayContent, debouncedSearch, useRegex]
  );

  // Reset to first match when debounced query changes
  useEffect(() => {
    setCurrentMatchIdx(0);
  }, [debouncedSearch, useRegex]);

  // Scroll current match into view after render
  useEffect(() => {
    if (!preRef.current || matches.length === 0) return;
    const el = preRef.current.querySelector('.raw-highlight-current');
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentMatchIdx, matches]);

  // Scroll to a specific line number when requested, then highlight and fade
  useEffect(() => {
    if (!scrollToLine || !scrollContainerRef.current || !preRef.current) return;
    const lineHeight = parseFloat(getComputedStyle(preRef.current).lineHeight);
    const paddingTop = parseFloat(getComputedStyle(preRef.current).paddingTop);
    lineHeightRef.current = lineHeight;
    paddingTopRef.current = paddingTop;
    scrollContainerRef.current.scrollTop = paddingTop + (scrollToLine - 1) * lineHeight;
    onScrolled?.();
    setHighlightLines({ start: scrollToLine, end: scrollToLineEnd ?? scrollToLine });
    const clearTimer = setTimeout(() => setHighlightLines(null), 4000);
    return () => { clearTimeout(clearTimer); };
  }, [scrollToLine]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFindNext = () => {
    if (matches.length === 0) return;
    setCurrentMatchIdx(prev => (prev + 1) % matches.length);
  };

  const handleFindPrev = () => {
    if (matches.length === 0) return;
    setCurrentMatchIdx(prev => (prev - 1 + matches.length) % matches.length);
  };

  const renderedContent = useMemo(() => {
    if (!debouncedSearch || matches.length === 0) return displayContent;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((m, idx) => {
      if (m.start > lastIndex) parts.push(displayContent.slice(lastIndex, m.start));
      parts.push(
        <mark
          key={idx}
          className={idx === currentMatchIdx ? 'raw-highlight raw-highlight-current' : 'raw-highlight'}
        >
          {displayContent.slice(m.start, m.end)}
        </mark>
      );
      lastIndex = m.end;
    });

    if (lastIndex < displayContent.length) parts.push(displayContent.slice(lastIndex));
    return parts;
  }, [displayContent, matches, currentMatchIdx, debouncedSearch]);

  return (
    <div className="raw-file-viewer">
      <div className="raw-file-toolbar">
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.shiftKey ? handleFindPrev() : handleFindNext(); }
          }}
          placeholder="Find in file…"
          className="raw-file-search-input"
        />
        <button
          onClick={handleFindPrev}
          className="raw-file-nav-btn"
          disabled={matches.length === 0}
          title="Previous match (Shift+Enter)"
        >‹</button>
        <button
          onClick={handleFindNext}
          className="raw-file-nav-btn"
          disabled={matches.length === 0}
          title="Next match (Enter)"
        >›</button>
        <button
          onClick={() => setUseRegex(r => !r)}
          className={`raw-file-regex-btn${useRegex ? ' active' : ''}`}
          title="Toggle regular expression"
        >
          .*
        </button>
        <span className="raw-file-match-count">
          {debouncedSearch
            ? matches.length === 0
              ? 'No matches'
              : `${currentMatchIdx + 1} of ${matches.length}`
            : ''}
        </span>
        <label className="raw-file-wrap-toggle">
          <input
            type="checkbox"
            className="app-checkbox"
            checked={wrap}
            onChange={e => setWrap(e.target.checked)}
          />
          Wrap
        </label>
      </div>
      <div className="raw-file-scroll" ref={scrollContainerRef}>
        {features.rawFileLineNumbers && (
          <pre className="raw-file-line-numbers" aria-hidden>
            {Array.from({ length: displayContent.split('\n').length }, (_, i) => i + 1).join('\n')}
          </pre>
        )}
        <pre
          ref={preRef}
          className="raw-file-content"
          style={{ whiteSpace: wrap ? 'pre-wrap' : 'pre', width: wrap ? undefined : 'max-content', position: 'relative' }}
        >
          {highlightLines && (
            <span
              className="raw-file-line-highlight"
              style={{
                top: paddingTopRef.current + (highlightLines.start - 1) * lineHeightRef.current,
                height: (highlightLines.end - highlightLines.start + 1) * lineHeightRef.current,
              }}
            />
          )}
          {renderedContent}
        </pre>
      </div>
    </div>
  );
}
