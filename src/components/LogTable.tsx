import { useState, useMemo, useRef, useEffect, useLayoutEffect, ReactNode } from 'react';
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
  const [collapsedCols, setCollapsedCols] = useState<Set<SortColumn>>(() => {
    const saved = loadColumnPreferences();
    if (!saved?.collapsed) return new Set();
    return new Set(saved.collapsed.filter(c => DEFAULT_COL_ORDER.includes(c as SortColumn)) as SortColumn[]);
  });

  const toggleCollapse = (col: SortColumn) => {
    setCollapsedCols(prev => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col); else next.add(col);
      saveColumnPreferences(colOrder, colWidths, [...next]);
      return next;
    });
  };

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
    saveColumnPreferences(colOrder, colWidths, [...collapsedCols]);
  }, [colOrder, colWidths, collapsedCols]);

  // Auto-size timestamp and level columns to fit their content
  useLayoutEffect(() => {
    if (entries.length === 0) return;
    const tsCell = document.querySelector<HTMLElement>('.timestamp-cell');
    const levelCell = document.querySelector<HTMLElement>('.level-cell');
    if (!tsCell || !levelCell) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Measure timestamp (format is always fixed-width: "YYYYMMDD HH:MM:SS.mmm")
    ctx.font = window.getComputedStyle(tsCell).font;
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const pad3 = (n: number) => String(n).padStart(3, '0');
    const t = entries[0].timestamp;
    const tsStr = `${t.getFullYear()}${pad2(t.getMonth()+1)}${pad2(t.getDate())} ${pad2(t.getHours())}:${pad2(t.getMinutes())}:${pad2(t.getSeconds())}.${pad3(t.getMilliseconds())}`;
    const tsCellStyle = window.getComputedStyle(tsCell);
    const tsPadH = parseFloat(tsCellStyle.paddingLeft) + parseFloat(tsCellStyle.paddingRight);
    const tsWidth = Math.ceil(ctx.measureText(tsStr).width) + tsPadH + 2;

    // Measure level — find the longest level value across all entries
    const longestLevel = [...new Set(entries.map(e => e.level.toUpperCase()))]
      .reduce((a, b) => (a.length >= b.length ? a : b), '');
    const badge = levelCell.querySelector<HTMLElement>('.level-badge');
    const badgeStyle = badge ? window.getComputedStyle(badge) : null;
    ctx.font = badgeStyle ? badgeStyle.font : window.getComputedStyle(levelCell).font;
    const badgePadH = badgeStyle ? parseFloat(badgeStyle.paddingLeft) + parseFloat(badgeStyle.paddingRight) : 0;
    const levelCellStyle = window.getComputedStyle(levelCell);
    const levelPadH = parseFloat(levelCellStyle.paddingLeft) + parseFloat(levelCellStyle.paddingRight);
    const levelWidth = Math.ceil(ctx.measureText(longestLevel).width) + badgePadH + levelPadH + 2;

    setColWidths(prev => ({ ...prev, timestamp: tsWidth, level: levelWidth }));
  }, [entries]);

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
  const totalRows = sortedEntries.length;
  const rawStart = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIdx = Math.min(totalRows, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN);
  // When we've reached the last row, clamp startIdx to a stable minimum window.
  // Without this, variable-height rows (taller than ROW_HEIGHT) cause scrollTop to
  // exceed scrollHeight at the bottom, triggering a feedback loop of re-renders.
  const minWindow = Math.ceil(containerHeight / ROW_HEIGHT) + 2 * OVERSCAN;
  const startIdx = endIdx >= totalRows ? Math.max(0, totalRows - minWindow) : rawStart;
  const visibleEntries = sortedEntries.slice(startIdx, endIdx);
  const paddingTop = startIdx * ROW_HEIGHT;
  const paddingBottom = (totalRows - endIdx) * ROW_HEIGHT;

  // ── Cell renderer ────────────────────────────────────────────────────────────
  const renderCell = (entry: LogEntry, col: SortColumn) => {
    if (collapsedCols.has(col)) return <td key={col} className="cell-collapsed" />;
    switch (col) {
      case 'timestamp': {
        const t = entry.timestamp;
        const pad2 = (n: number) => String(n).padStart(2, '0');
        const pad3 = (n: number) => String(n).padStart(3, '0');
        const formatted = `${t.getFullYear()}${pad2(t.getMonth() + 1)}${pad2(t.getDate())} ${pad2(t.getHours())}:${pad2(t.getMinutes())}:${pad2(t.getSeconds())}.${pad3(t.getMilliseconds())}`;
        return <td key={col} className="timestamp-cell">{highlightText(formatted, searchQuery, useRegex)}</td>;
      }
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
            {colOrder.map(col => <col key={col} style={{ width: collapsedCols.has(col) ? 28 : colWidths[col] }} />)}
          </colgroup>
          <thead>
            <tr>
              {colOrder.map(col => {
                const collapsed = collapsedCols.has(col);
                return (
                  <th
                    key={col}
                    draggable={!collapsed}
                    onDragStart={e => !collapsed && handleDragStart(col, e)}
                    onDragOver={e => !collapsed && handleDragOver(col, e)}
                    onDrop={() => !collapsed && handleDrop(col)}
                    onDragEnd={handleDragEnd}
                    onClick={() => !collapsed && handleSort(col)}
                    className={`sortable${dragOverCol === col ? ' col-drag-over' : ''}${collapsed ? ' col-collapsed-header' : ''}`}
                    title={collapsed ? `Expand ${COL_LABELS[col]}` : undefined}
                  >
                    {collapsed ? (
                      <button
                        className="col-expand-btn"
                        onClick={e => { e.stopPropagation(); toggleCollapse(col); }}
                        title={`Expand ${COL_LABELS[col]}`}
                      >›</button>
                    ) : (
                      <>
                        <button
                          className="col-collapse-btn"
                          onClick={e => { e.stopPropagation(); toggleCollapse(col); }}
                          title={`Collapse ${COL_LABELS[col]}`}
                        >‹</button>
                        {COL_LABELS[col]}{getSortIndicator(col)}
                        <div
                          className="resize-handle"
                          onMouseDown={e => startResize(col, e)}
                          draggable={false}
                          onDragStart={e => e.preventDefault()}
                        />
                      </>
                    )}
                  </th>
                );
              })}
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
