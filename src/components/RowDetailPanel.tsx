import { useEffect, useState } from 'react';
import { LogEntry } from '../lib/parser';
import { FilterConfig, getFilterDecision } from '../lib/filters';
import { useFeatures } from '../lib/FeaturesContext';
import { storage } from '../lib/local-storage';

interface RowDetailPanelProps {
  entry: LogEntry | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onScrollToEntry: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  entryIndex: number;
  totalEntries: number;
  sidebar?: boolean;
  comment?: string;
  onSetComment?: (id: string, comment: string) => void;
  onOpenInEditor?: (filename: string, lineNumberStart: number, lineNumberEnd: number) => void;
  width?: number;
  filters?: FilterConfig[];
}

function tryFormatJson(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

type JsonValue = string | number | boolean | null | { [k: string]: JsonValue } | JsonValue[];

function JsonNode({ value, label, depth }: { value: JsonValue; label?: React.ReactNode; depth: number }) {
  const [open, setOpen] = useState(() =>
    typeof value !== 'object' || value === null || JSON.stringify(value).length < 500
  );

  if (value === null || typeof value !== 'object') {
    const display = value === null
      ? <span className="jt-null">null</span>
      : typeof value === 'boolean'
        ? <span className="jt-bool">{String(value)}</span>
        : typeof value === 'number'
          ? <span className="jt-num">{value}</span>
          : <span className="jt-str">&quot;{String(value)}&quot;</span>;
    return <div className="jt-row" style={{ paddingLeft: depth * 14 }}>{label}{display}</div>;
  }

  const isArr = Array.isArray(value);
  const entries: [string | number, JsonValue][] = isArr
    ? (value as JsonValue[]).map((v, i) => [i, v])
    : Object.entries(value as Record<string, JsonValue>);
  const ob = isArr ? '[' : '{';
  const cb = isArr ? ']' : '}';

  if (!open || entries.length === 0) {
    return (
      <div
        className={`jt-row${entries.length > 0 ? ' jt-row--toggle' : ''}`}
        style={{ paddingLeft: depth * 14 }}
        onClick={entries.length > 0 ? () => setOpen(true) : undefined}
      >
        {entries.length > 0 && <span className="jt-arrow">▶</span>}
        {label}
        <span className="jt-bracket">{ob}</span>
        {!open && <span className="jt-summary">{entries.length}</span>}
        <span className="jt-bracket">{cb}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="jt-row jt-row--toggle" style={{ paddingLeft: depth * 14 }} onClick={() => setOpen(false)}>
        <span className="jt-arrow">▼</span>
        {label}
        <span className="jt-bracket">{ob}</span>
      </div>
      {entries.map(([k, v]) => (
        <JsonNode
          key={String(k)}
          value={v}
          label={isArr ? null : <span className="jt-key">&quot;{k}&quot;: </span>}
          depth={depth + 1}
        />
      ))}
      <div className="jt-row" style={{ paddingLeft: depth * 14 }}>
        <span className="jt-bracket">{cb}</span>
      </div>
    </div>
  );
}

function JsonTreeView({ text, scrollable }: { text: string; scrollable?: boolean }) {
  let parsed: JsonValue;
  try {
    parsed = JSON.parse(text) as JsonValue;
  } catch {
    return <pre className={`detail-message detail-muted detail-monospace${scrollable ? ' detail-message--scrollable' : ''}`}>{text}</pre>;
  }
  return (
    <div className={`jt-root${scrollable ? ' jt-root--scrollable' : ''}`}>
      <JsonNode value={parsed} depth={0} />
    </div>
  );
}

function formatTimestamp(t: Date): string {
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const pad3 = (n: number) => String(n).padStart(3, '0');
  return `${t.getFullYear()}-${pad2(t.getMonth()+1)}-${pad2(t.getDate())} ${pad2(t.getHours())}:${pad2(t.getMinutes())}:${pad2(t.getSeconds())}.${pad3(t.getMilliseconds())}`;
}

function loadSectionCollapsed(): Record<string, boolean> {
  return storage.loadDetailSectionCollapsed();
}

function saveSectionCollapsed(state: Record<string, boolean>): void {
  storage.saveDetailSectionCollapsed(state);
}

function CollapsibleSection({ label, grow, copyText, initialOpen, resetKey, showWrap, children }: { label: string; grow?: boolean; copyText?: string; initialOpen?: boolean; resetKey?: string; showWrap?: boolean; children: React.ReactNode | ((wrap: boolean) => React.ReactNode) }) {
  const key = label.toLowerCase();
  const [collapsed, setCollapsed] = useState(() => initialOpen ? false : (loadSectionCollapsed()[key] ?? false));
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);

  useEffect(() => {
    if (initialOpen && resetKey !== undefined) setCollapsed(false);
  }, [resetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => setCollapsed(c => {
    const next = !c;
    if (!initialOpen) {
      const state = loadSectionCollapsed();
      state[key] = next;
      saveSectionCollapsed(state);
    }
    return next;
  });

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!copyText) return;
    navigator.clipboard.writeText(copyText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className={`detail-field detail-field--block${grow && !collapsed ? ' detail-field--grow' : ''}`}>
      <button className="detail-section-toggle" onClick={toggle}>
        <span className="collapse-arrow">{collapsed ? '▶' : '▼'}</span>
        <span className="detail-field-label">{label}</span>
        {showWrap && !collapsed && (
          <label className="detail-wrap-label" onClick={e => e.stopPropagation()}>
            <input type="checkbox" checked={wrap} onChange={e => setWrap(e.target.checked)} />
            Wrap
          </label>
        )}
        {copyText && (
          <span className={`detail-copy-btn${copied ? ' detail-copy-btn--copied' : ''}`} onClick={handleCopy} title="Copy to clipboard">
            {copied ? '✓' : '⎘'}
          </span>
        )}
      </button>
      {!collapsed && (typeof children === 'function' ? children(wrap) : children)}
    </div>
  );
}

function ParsedSection({ entry }: { entry: LogEntry }) {
  return (
    <CollapsibleSection label="Parsed" grow copyText={tryFormatJson(entry.raw)} initialOpen resetKey={entry.id}>
      <JsonTreeView key={entry.id} text={entry.raw} />
    </CollapsibleSection>
  );
}

function DetailBody({ entry, onClose, onPrev, onNext, onScrollToEntry, hasPrev, hasNext, entryIndex, totalEntries, sidebar, comment = '', onSetComment, onOpenInEditor, filters }: Omit<RowDetailPanelProps, 'dialog'> & { entry: LogEntry }) {
  const { features, setFeature } = useFeatures();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 't' || e.key === 'T') setFeature('entryDetailSidebar', !features.entryDetailSidebar);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [features.entryDetailSidebar, setFeature]);
  const matchedFilters = (filters ?? []).filter(f => f.enabled && getFilterDecision(entry, f) === true);
  return (
    <>
      <div className="detail-panel-header">
        <span className="detail-panel-title">Entry Detail <span className="detail-panel-position">({entryIndex.toLocaleString()}/{totalEntries.toLocaleString()})</span></span>
        <div className="detail-panel-nav">
          <button onClick={onPrev} disabled={!hasPrev} title="Previous entry (←)">‹</button>
          <button onClick={onNext} disabled={!hasNext} title="Next entry (→)">›</button>
          <button className="detail-panel-scroll-to" onClick={onScrollToEntry} title="Scroll to this entry in the log table (C)">⌖</button>
        </div>
        <button
          className="detail-panel-close"
          onClick={() => setFeature('entryDetailSidebar', !features.entryDetailSidebar)}
          title={sidebar ? 'Switch to overlay mode (T)' : 'Switch to sidebar mode (T)'}
        >{sidebar ? '⇥' : '⇤'}</button>
        {!sidebar && (
          <button className="detail-panel-close" onClick={onClose} title="Close (Esc)">✕</button>
        )}
      </div>

      <div className="detail-panel-body">
        <div className="detail-field">
          <span className="detail-field-label">Timestamp</span>
          <span className="detail-field-value detail-monospace">{formatTimestamp(entry.timestamp)}</span>
        </div>

        <div className="detail-field">
          <span className="detail-field-label">Level</span>
          <span className={`level-badge ${entry.level.toLowerCase()} detail-field-value`}>
            {entry.level.toUpperCase()}
          </span>
        </div>

        {entry.filename && (
          <div className="detail-field">
            <span className="detail-field-label">File</span>
            <span className="detail-field-value detail-monospace">{entry.filename}</span>
          </div>
        )}

        <div className="detail-field">
          <span className="detail-field-label">Source</span>
          <span className="detail-field-value">{entry.source}</span>
        </div>

        <div className="detail-field">
          <span className="detail-field-label">Parser</span>
          <span className="detail-field-value detail-muted">{entry.parser ?? '—'}</span>
        </div>

        <div className="detail-field">
          <span className="detail-field-label">Line</span>
          <span className="detail-field-value detail-muted">
            {entry.lineNumberStart == null
              ? '—'
              : (() => {
                  const label = entry.lineNumberEnd != null && entry.lineNumberEnd !== entry.lineNumberStart
                    ? `${entry.lineNumberStart} – ${entry.lineNumberEnd}`
                    : String(entry.lineNumberStart);
                  const canOpen = entry.filename != null && onOpenInEditor != null;
                  return canOpen
                    ? <>{label}<button className="detail-line-open-btn" onClick={() => onOpenInEditor!(entry.filename!, entry.lineNumberStart!, entry.lineNumberEnd ?? entry.lineNumberStart!)} title="Open in file viewer">⧉</button></>
                    : label;
                })()}
          </span>
        </div>

        <div className="detail-field">
          <span className="detail-field-label">Filters</span>
          <span className="detail-field-value detail-filter-matches">
            {matchedFilters.length === 0
              ? <span className="detail-muted">—</span>
              : matchedFilters.map(f => (
                  <span key={f.id} className="detail-filter-badge" style={f.colorEnabled && f.color ? { background: f.color + '55', borderColor: f.color } : undefined}>
                    {f.name}
                  </span>
                ))
            }
          </span>
        </div>

        {features.entryComments && (
          <div className="detail-field detail-field--block">
            <span className="detail-field-label">Comment</span>
            <textarea
              className="detail-comment-textarea"
              value={comment}
              onChange={e => onSetComment?.(entry.id, e.target.value)}
              placeholder="Add a comment…"
              rows={3}
            />
          </div>
        )}

        <CollapsibleSection label="Message" grow showWrap copyText={tryFormatJson(entry.message)}>
          {(wrap) => (
            <pre className={`detail-message${!wrap && features.messageScrollable ? ' detail-message--scrollable' : ''}`}>{tryFormatJson(entry.raw)}</pre>
          )}
        </CollapsibleSection>

        {features.showParsed && (<ParsedSection entry={entry} />)}

        {features.showMetadata && entry.metadata && (
          <CollapsibleSection label="Metadata" copyText={JSON.stringify(entry.metadata, null, 2)}>
            <pre className={`detail-message detail-monospace${features.messageScrollable ? ' detail-message--scrollable' : ''}`}>
              {JSON.stringify(entry.metadata, null, 2)}
            </pre>
          </CollapsibleSection>
        )}
      </div>
    </>
  );
}

export default function RowDetailPanel({ entry, onClose, onPrev, onNext, onScrollToEntry, hasPrev, hasNext, entryIndex, totalEntries, sidebar, comment, onSetComment, onOpenInEditor, width, filters }: RowDetailPanelProps) {
  useEffect(() => {
    if (!entry) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sidebar) onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
      if (e.key === 'C' || e.key === 'c') onScrollToEntry();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [entry, onClose, onPrev, onNext, hasPrev, hasNext, sidebar]);

  if (sidebar) {
    return (
      <aside className="row-detail-sidebar" style={width !== undefined ? { width } : undefined}>
        {entry ? (
          <DetailBody entry={entry} onClose={onClose} onPrev={onPrev} onNext={onNext} onScrollToEntry={onScrollToEntry} hasPrev={hasPrev} hasNext={hasNext} entryIndex={entryIndex} totalEntries={totalEntries} sidebar comment={comment} onSetComment={onSetComment} onOpenInEditor={onOpenInEditor} filters={filters} />
        ) : (
          <div className="detail-sidebar-empty">
            <span>Select an entry to view details</span>
          </div>
        )}
      </aside>
    );
  }

  if (!entry) return null;

  return (
    <>
      <div className="detail-panel-overlay" onClick={onClose} />
      <div className="row-detail-panel">
        <DetailBody entry={entry} onClose={onClose} onPrev={onPrev} onNext={onNext} onScrollToEntry={onScrollToEntry} hasPrev={hasPrev} hasNext={hasNext} entryIndex={entryIndex} totalEntries={totalEntries} comment={comment} onSetComment={onSetComment} onOpenInEditor={onOpenInEditor} filters={filters} />
      </div>
    </>
  );
}
