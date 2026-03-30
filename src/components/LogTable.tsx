import { useState, useMemo, useRef, useEffect, useLayoutEffect, ReactNode, useCallback } from 'react';
import { LogEntry } from '../lib/parser';
import MessageCell from './MessageCell';
import { storage } from '../lib/local-storage';
import { useFeatures } from '../lib/FeaturesContext';

interface LogTableProps {
  entries: LogEntry[];
  searchQuery?: string;
  useRegex?: boolean;
  activeEntryId?: string | null;
  onRowClick?: (entry: LogEntry) => void;
  onSortedEntriesChange?: (entries: LogEntry[]) => void;
  centerOnActiveEntry?: number;
}

interface DisplayEntry {
  entry: LogEntry;
  count: number;
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

export default function LogTable({
  entries,
  searchQuery = '',
  useRegex = false,
  activeEntryId,
  onRowClick,
  onSortedEntriesChange,
  centerOnActiveEntry,
}: LogTableProps) {
  const { features } = useFeatures();
  const saved = storage.loadSortPreference();
  const [sortColumn, setSortColumn] = useState<SortColumn>(
    (saved?.column as SortColumn) || 'timestamp'
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    (saved?.direction as SortDirection) || 'desc'
  );
  const savedCols = storage.loadColumnPreferences();
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
    const saved = storage.loadColumnPreferences();
    if (!saved?.collapsed) return new Set();
    return new Set(saved.collapsed.filter(c => DEFAULT_COL_ORDER.includes(c as SortColumn)) as SortColumn[]);
  });

  // ── Message expanded state (persisted across virtual scroll) ─────────────────
  const [expandedMessages, setExpandedMessages] = useState<Map<string, { text: boolean; json: boolean }>>(new Map());

  const getMessageExpanded = (id: string) => expandedMessages.get(id) ?? { text: false, json: false };
  const setMessageExpanded = (id: string, patch: Partial<{ text: boolean; json: boolean }>) => {
    setExpandedMessages(prev => {
      const next = new Map(prev);
      next.set(id, { ...(prev.get(id) ?? { text: false, json: false }), ...patch });
      return next;
    });
  };

  // ── Row selection (for copy) ──────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastClickedIdxRef = useRef<number>(-1);
  const suppressScrollRef = useRef(false);

  const toggleCollapse = (col: SortColumn) => {
    setCollapsedCols(prev => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col); else next.add(col);
      storage.saveColumnPreferences(colOrder, colWidths, [...next]);
      return next;
    });
  };

  const resizing = useRef<{ col: SortColumn; startX: number; startWidth: number } | null>(null);
  const draggingCol = useRef<SortColumn | null>(null);

  // ── Virtual scroll ───────────────────────────────────────────────────────────
  const ROW_HEIGHT = 28;
  const OVERSCAN = 15;
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
    storage.saveColumnPreferences(colOrder, colWidths, [...collapsedCols]);
  }, [colOrder, colWidths, collapsedCols]);

  // Auto-size timestamp and level columns to fit their content
  useLayoutEffect(() => {
    if (!features.autoSizeColumns) return;
    if (entries.length === 0) return;
    const tsCell = document.querySelector<HTMLElement>('.timestamp-cell');
    const levelCell = document.querySelector<HTMLElement>('.level-cell');
    if (!tsCell || !levelCell) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tsCellStyle = window.getComputedStyle(tsCell);
    ctx.font = `${tsCellStyle.fontWeight} ${tsCellStyle.fontSize} ${tsCellStyle.fontFamily}`;
    const tsStr = '20001208 08:08:08.888';
    const tsPadH = parseFloat(tsCellStyle.paddingLeft) + parseFloat(tsCellStyle.paddingRight);
    const tsTarget = Math.ceil(ctx.measureText(tsStr).width) + tsPadH + 4;

    const longestLevel = [...new Set(entries.map(e => e.level.toUpperCase()))]
      .reduce((a, b) => (a.length >= b.length ? a : b), '');
    const badge = levelCell.querySelector<HTMLElement>('.level-badge');
    const badgeStyle = badge ? window.getComputedStyle(badge) : null;
    const badgeFontBase = badgeStyle ?? window.getComputedStyle(levelCell);
    ctx.font = `${badgeFontBase.fontWeight} ${badgeFontBase.fontSize} ${badgeFontBase.fontFamily}`;
    const badgePadH = badgeStyle ? parseFloat(badgeStyle.paddingLeft) + parseFloat(badgeStyle.paddingRight) : 0;
    const levelCellStyle = window.getComputedStyle(levelCell);
    const levelPadH = parseFloat(levelCellStyle.paddingLeft) + parseFloat(levelCellStyle.paddingRight);
    const lvlTarget = Math.ceil(ctx.measureText(longestLevel).width) + badgePadH + levelPadH + 4;

    // table { width: 100% } with table-layout: fixed scales all columns proportionally when
    // their sum < table width. Setting both columns simultaneously, the correction is:
    //   T = target * sumOther / (tableWidth - tsTarget - lvlTarget)
    const tableWidth = (tsCell.closest('table') as HTMLElement)?.getBoundingClientRect().width ?? 0;
    const sumOther = colOrder
      .filter(col => col !== 'timestamp' && col !== 'level')
      .reduce((sum, col) => sum + (collapsedCols.has(col) ? 28 : colWidths[col]), 0);
    const denom = tableWidth - tsTarget - lvlTarget;
    const tsWidth  = tableWidth > 0 && denom > 0 ? (tsTarget  * sumOther) / denom : tsTarget;
    const lvlWidth = tableWidth > 0 && denom > 0 ? (lvlTarget * sumOther) / denom : lvlTarget;

    setColWidths(prev => ({ ...prev, timestamp: tsWidth, level: lvlWidth }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, colWidths.file, colWidths.source, colWidths.message, collapsedCols]);

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

  useEffect(() => {
    onSortedEntriesChange?.(sortedEntries);
  }, [sortedEntries, onSortedEntriesChange]);

  // ── Deduplication ────────────────────────────────────────────────────────────
  const displayEntries = useMemo((): DisplayEntry[] => {
    if (!features.deduplication) {
      return sortedEntries.map(e => ({ entry: e, count: 1 }));
    }
    const result: DisplayEntry[] = [];
    for (const entry of sortedEntries) {
      const last = result[result.length - 1];
      if (
        last &&
        last.entry.message === entry.message &&
        last.entry.level === entry.level &&
        last.entry.source === entry.source
      ) {
        last.count++;
      } else {
        result.push({ entry, count: 1 });
      }
    }
    return result;
  }, [sortedEntries, features.deduplication]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      const dir = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(dir);
      storage.saveSortPreference(column, dir);
    } else {
      setSortColumn(column);
      setSortDirection('asc');
      storage.saveSortPreference(column, 'asc');
    }
  };

  const getSortIndicator = (column: SortColumn) =>
    sortColumn !== column ? ' ⇅' : sortDirection === 'asc' ? ' ▲' : ' ▼';

  // ── Virtual window ───────────────────────────────────────────────────────────
  const totalRows = displayEntries.length;
  const rawStart = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIdx = Math.min(totalRows, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN);
  const minWindow = Math.ceil(containerHeight / ROW_HEIGHT) + 2 * OVERSCAN;
  const startIdx = endIdx >= totalRows ? Math.max(0, totalRows - minWindow) : rawStart;
  const visibleEntries = displayEntries.slice(startIdx, endIdx);
  const paddingTop = startIdx * ROW_HEIGHT;
  const paddingBottom = (totalRows - endIdx) * ROW_HEIGHT;

  // ── Scroll active entry into view ────────────────────────────────────────────
  useEffect(() => {
    if (!features.autoScrollToEntry || !activeEntryId || !scrollEl) return;
    if (suppressScrollRef.current) { suppressScrollRef.current = false; return; }
    const idx = displayEntries.findIndex(d => d.entry.id === activeEntryId);
    if (idx === -1) return;
    const rowTop = idx * ROW_HEIGHT;
    const rowBottom = rowTop + ROW_HEIGHT;
    if (rowTop < scrollEl.scrollTop) {
      scrollEl.scrollTop = rowTop;
    } else if (rowBottom > scrollEl.scrollTop + scrollEl.clientHeight) {
      scrollEl.scrollTop = rowBottom - scrollEl.clientHeight;
    }
  }, [activeEntryId, displayEntries, scrollEl]);

  // ── Center active entry (triggered by prev/next navigation or scroll-to button) ──
  useEffect(() => {
    if (!centerOnActiveEntry || !activeEntryId || !scrollEl) return;
    const idx = displayEntries.findIndex(d => d.entry.id === activeEntryId);
    if (idx === -1) return;
    scrollEl.scrollTop = idx * ROW_HEIGHT;
  }, [centerOnActiveEntry]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Row click / selection ────────────────────────────────────────────────────
  const handleRowClick = useCallback((displayEntry: DisplayEntry, idx: number, e: React.MouseEvent) => {
    const entry = displayEntry.entry;
    if (e.ctrlKey || e.metaKey) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(entry.id)) next.delete(entry.id); else next.add(entry.id);
        return next;
      });
      lastClickedIdxRef.current = idx;
    } else if (e.shiftKey && lastClickedIdxRef.current !== -1) {
      const from = Math.min(lastClickedIdxRef.current, idx);
      const to = Math.max(lastClickedIdxRef.current, idx);
      setSelectedIds(prev => {
        const next = new Set(prev);
        for (let i = from; i <= to; i++) {
          next.add(displayEntries[i].entry.id);
        }
        return next;
      });
    } else {
      setSelectedIds(new Set());
      lastClickedIdxRef.current = idx;
      suppressScrollRef.current = true;
      onRowClick?.(entry);
    }
  }, [displayEntries, onRowClick]);

  // ── Keyboard navigation ──────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!onRowClick) return;
    const activeIdx = activeEntryId
      ? displayEntries.findIndex(d => d.entry.id === activeEntryId)
      : -1;

    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault();
      const next = activeIdx < displayEntries.length - 1 ? activeIdx + 1 : activeIdx;
      if (displayEntries[next]) onRowClick(displayEntries[next].entry);
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault();
      const prev = activeIdx > 0 ? activeIdx - 1 : 0;
      if (displayEntries[prev]) onRowClick(displayEntries[prev].entry);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx !== -1 && displayEntries[activeIdx]) onRowClick(displayEntries[activeIdx].entry);
    }
  }, [activeEntryId, displayEntries, onRowClick]);

  // ── Copy selection ───────────────────────────────────────────────────────────
  const copySelectedRows = () => {
    const rows = displayEntries
      .filter(d => selectedIds.has(d.entry.id))
      .map(d => {
        const e = d.entry;
        const t = e.timestamp;
        const pad2 = (n: number) => String(n).padStart(2, '0');
        const pad3 = (n: number) => String(n).padStart(3, '0');
        const ts = `${t.getFullYear()}${pad2(t.getMonth()+1)}${pad2(t.getDate())} ${pad2(t.getHours())}:${pad2(t.getMinutes())}:${pad2(t.getSeconds())}.${pad3(t.getMilliseconds())}`;
        return [ts, e.level.toUpperCase(), e.filename || e.source, e.source, e.message].join('\t');
      });
    navigator.clipboard.writeText(rows.join('\n'));
  };

  // ── Cell renderer ────────────────────────────────────────────────────────────
  const renderCell = (entry: LogEntry, col: SortColumn, count: number) => {
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
              {count > 1 && <span className="dedup-count-badge">×{count}</span>}
              <MessageCell
                message={entry.message}
                searchQuery={searchQuery}
                useRegex={useRegex}
                textExpanded={getMessageExpanded(entry.id).text}
                jsonExpanded={getMessageExpanded(entry.id).json}
                onTextExpanded={(v) => setMessageExpanded(entry.id, { text: v })}
                onJsonExpanded={(v) => setMessageExpanded(entry.id, { json: v })}
              />
            </div>
          </td>
        );
    }
  };

  return (
    <div className="log-table">
      {selectedIds.size > 0 && (
        <div className="table-control">
          <span className="copy-selection-info">
            {selectedIds.size} selected
            <button className="copy-rows-btn" onClick={copySelectedRows}>Copy {selectedIds.size}</button>
            <button className="clear-selection-btn" onClick={() => setSelectedIds(new Set())}>✕</button>
          </span>
        </div>
      )}
      <div
        className="table-wrapper"
        ref={setScrollEl}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
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
            {entries.length === 0 && (
              <tr><td colSpan={colOrder.length} className="table-empty-cell">No log entries to display</td></tr>
            )}
            {paddingTop > 0 && <tr style={{ height: paddingTop }}><td colSpan={colOrder.length} /></tr>}
            {visibleEntries.map((displayEntry, i) => {
              const { entry, count } = displayEntry;
              const globalIdx = startIdx + i;
              const isActive = entry.id === activeEntryId;
              const isSelected = selectedIds.has(entry.id);
              return (
                <tr
                  key={entry.id}
                  className={`level-${entry.level.toLowerCase()}${isActive ? ' row-active' : ''}${isSelected ? ' row-selected' : ''}`}
                  onClick={e => handleRowClick(displayEntry, globalIdx, e)}
                  style={{ cursor: 'pointer' }}
                >
                  {colOrder.map(col => renderCell(entry, col, count))}
                </tr>
              );
            })}
            {paddingBottom > 0 && <tr style={{ height: paddingBottom }}><td colSpan={colOrder.length} /></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
