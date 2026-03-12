import { useState, useMemo, useRef, useEffect, ReactNode } from 'react';
import { LogEntry } from '../lib/parser';
import MessageCell from './MessageCell';
import { saveSortPreference, loadSortPreference, saveColumnPreferences, loadColumnPreferences } from '../lib/statistics';

interface LogTableProps {
  entries: LogEntry[];
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

type SortColumn = 'timestamp' | 'level' | 'file' | 'source' | 'message';
type SortDirection = 'asc' | 'desc';

const DEFAULT_COL_ORDER: SortColumn[] = ['timestamp', 'level', 'file', 'source', 'message'];

const DEFAULT_COL_WIDTHS: Record<SortColumn, number> = {
  timestamp: 200,
  level:     100,
  file:      160,
  source:    140,
  message:   400,
};

const COL_LABELS: Record<SortColumn, string> = {
  timestamp: 'Timestamp',
  level:     'Level',
  file:      'File',
  source:    'Source',
  message:   'Message',
};

export default function LogTable({ entries, searchQuery = '', useRegex = false }: LogTableProps) {
  const saved = loadSortPreference();
  const [sortColumn, setSortColumn] = useState<SortColumn>(
    (saved?.column as SortColumn) || 'timestamp'
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    (saved?.direction as SortDirection) || 'desc'
  );
  const savedCols = loadColumnPreferences();
  const [colWidths, setColWidths] = useState<Record<SortColumn, number>>(
    savedCols ? { ...DEFAULT_COL_WIDTHS, ...savedCols.widths } as Record<SortColumn, number> : DEFAULT_COL_WIDTHS
  );
  const [colOrder, setColOrder] = useState<SortColumn[]>(() => {
    if (savedCols?.order) {
      const valid = savedCols.order.filter(c => DEFAULT_COL_ORDER.includes(c as SortColumn)) as SortColumn[];
      const missing = DEFAULT_COL_ORDER.filter(c => !valid.includes(c));
      return [...valid, ...missing];
    }
    return DEFAULT_COL_ORDER;
  });
  const [dragOverCol, setDragOverCol] = useState<SortColumn | null>(null);

  const resizing = useRef<{ col: SortColumn; startX: number; startWidth: number } | null>(null);
  const draggingCol = useRef<SortColumn | null>(null);

  // ── Virtual scroll ───────────────────────────────────────────────────────────
  const ROW_HEIGHT = 36; // px — approximate row height for computing visible window
  const OVERSCAN = 15;   // extra rows to render above and below the viewport
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    if (!scrollEl) return;
    setContainerHeight(scrollEl.clientHeight);
    const onScroll = () => setScrollTop(scrollEl.scrollTop);
    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver(() => setContainerHeight(scrollEl.clientHeight));
    ro.observe(scrollEl);
    return () => {
      scrollEl.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [scrollEl]);

  useEffect(() => {
    saveColumnPreferences(colOrder, colWidths);
  }, [colOrder, colWidths]);

  // ── Column resize ────────────────────────────────────────────────────────────
  const startResize = (col: SortColumn, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = { col, startX: e.clientX, startWidth: colWidths[col] };

    const onMouseMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const newWidth = Math.max(60, resizing.current.startWidth + ev.clientX - resizing.current.startX);
      setColWidths(prev => ({ ...prev, [resizing.current!.col]: newWidth }));
    };

    const onMouseUp = () => {
      resizing.current = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // ── Column reorder ───────────────────────────────────────────────────────────
  const handleDragStart = (col: SortColumn, e: React.DragEvent) => {
    draggingCol.current = col;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (col: SortColumn, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggingCol.current && draggingCol.current !== col) {
      setDragOverCol(col);
    }
  };

  const handleDrop = (targetCol: SortColumn) => {
    const src = draggingCol.current;
    if (!src || src === targetCol) { setDragOverCol(null); return; }
    const next = [...colOrder];
    next.splice(next.indexOf(src), 1);
    next.splice(next.indexOf(targetCol), 0, src);
    setColOrder(next);
    draggingCol.current = null;
    setDragOverCol(null);
  };

  const handleDragEnd = () => {
    draggingCol.current = null;
    setDragOverCol(null);
  };

  // ── Sorting ──────────────────────────────────────────────────────────────────
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      let aVal: unknown;
      let bVal: unknown;

      switch (sortColumn) {
        case 'timestamp': aVal = a.timestamp.getTime(); bVal = b.timestamp.getTime(); break;
        case 'level':     aVal = a.level.toLowerCase(); bVal = b.level.toLowerCase(); break;
        case 'file':      aVal = (a.filename || a.source || '').toLowerCase(); bVal = (b.filename || b.source || '').toLowerCase(); break;
        case 'source':    aVal = a.source.toLowerCase(); bVal = b.source.toLowerCase(); break;
        case 'message':   aVal = a.message.toLowerCase(); bVal = b.message.toLowerCase(); break;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string')
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      if (typeof aVal === 'number' && typeof bVal === 'number')
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      return 0;
    });
  }, [entries, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      const dir = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(dir);
      saveSortPreference(column, dir);
    } else {
      setSortColumn(column);
      setSortDirection('asc');
      saveSortPreference(column, 'asc');
    }
  };

  const getSortIndicator = (column: SortColumn) =>
    sortColumn !== column ? ' ⇅' : sortDirection === 'asc' ? ' ▲' : ' ▼';

  // ── Virtual window ───────────────────────────────────────────────────────────
  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIdx = Math.min(sortedEntries.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN);
  const visibleEntries = sortedEntries.slice(startIdx, endIdx);
  const paddingTop = startIdx * ROW_HEIGHT;
  const paddingBottom = (sortedEntries.length - endIdx) * ROW_HEIGHT;

  // ── Cell renderer ────────────────────────────────────────────────────────────
  const renderCell = (entry: LogEntry, col: SortColumn) => {
    switch (col) {
      case 'timestamp':
        return <td key={col} className="timestamp-cell">{highlightText(entry.timestamp.toLocaleString(), searchQuery, useRegex)}</td>;
      case 'level':
        return (
          <td key={col} className="level-cell">
            <span className={`level-badge ${entry.level.toLowerCase()}`}>
              {highlightText(entry.level.toUpperCase(), searchQuery, useRegex)}
            </span>
          </td>
        );
      case 'file':
        return <td key={col} className="file-cell">{highlightText(entry.filename || entry.source, searchQuery, useRegex)}</td>;
      case 'source':
        return <td key={col} className="source-cell">{highlightText(entry.source, searchQuery, useRegex)}</td>;
      case 'message':
        return (
          <td key={col} className="message-cell">
            <div className="message-content">
              <MessageCell message={entry.message} searchQuery={searchQuery} useRegex={useRegex} />
            </div>
          </td>
        );
    }
  };

  if (entries.length === 0) {
    return (
      <div className="log-table">
        <p className="empty-message">No log entries to display</p>
      </div>
    );
  }

  return (
    <div className="log-table">
      <div className="table-control">
        <span className="entry-count">{entries.length} entries</span>
      </div>
      <div className="table-wrapper" ref={setScrollEl}>
        <table style={{ tableLayout: 'fixed' }}>
          <colgroup>
            {colOrder.map(col => <col key={col} style={{ width: colWidths[col] }} />)}
          </colgroup>
          <thead>
            <tr>
              {colOrder.map(col => (
                <th
                  key={col}
                  draggable
                  onDragStart={e => handleDragStart(col, e)}
                  onDragOver={e => handleDragOver(col, e)}
                  onDrop={() => handleDrop(col)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleSort(col)}
                  className={`sortable${dragOverCol === col ? ' col-drag-over' : ''}`}
                >
                  {COL_LABELS[col]}{getSortIndicator(col)}
                  <div
                    className="resize-handle"
                    onMouseDown={e => startResize(col, e)}
                    draggable={false}
                    onDragStart={e => e.preventDefault()}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paddingTop > 0 && <tr style={{ height: paddingTop }}><td colSpan={colOrder.length} /></tr>}
            {visibleEntries.map(entry => (
              <tr key={entry.id} className={`level-${entry.level.toLowerCase()}`}>
                {colOrder.map(col => renderCell(entry, col))}
              </tr>
            ))}
            {paddingBottom > 0 && <tr style={{ height: paddingBottom }}><td colSpan={colOrder.length} /></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
