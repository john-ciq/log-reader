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

function CollapsibleSection({ label, grow, copyText, children }: { label: string; grow?: boolean; copyText?: string; children: React.ReactNode }) {
  const key = label.toLowerCase();
  const [collapsed, setCollapsed] = useState(() => loadSectionCollapsed()[key] ?? false);
  const [copied, setCopied] = useState(false);

  const toggle = () => setCollapsed(c => {
    const next = !c;
    const state = loadSectionCollapsed();
    state[key] = next;
    saveSectionCollapsed(state);
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
        {copyText && (
          <span className={`detail-copy-btn${copied ? ' detail-copy-btn--copied' : ''}`} onClick={handleCopy} title="Copy to clipboard">
            {copied ? '✓' : '⎘'}
          </span>
        )}
      </button>
      {!collapsed && children}
    </div>
  );
}

function DetailBody({ entry, onClose, onPrev, onNext, onScrollToEntry, hasPrev, hasNext, entryIndex, totalEntries, sidebar, comment = '', onSetComment, onOpenInEditor, filters }: Omit<RowDetailPanelProps, 'dialog'> & { entry: LogEntry }) {
  const { features, setFeature } = useFeatures();
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
          title={sidebar ? 'Switch to overlay mode' : 'Switch to sidebar mode'}
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



        {/* <CollapsibleSection label="Message" copyText={tryFormatJson(entry.message)}>
          <pre className={`detail-message${features.messageScrollable ? ' detail-message--scrollable' : ''}`}>{tryFormatJson(entry.message)}</pre>
        </CollapsibleSection> */}

        {/* {hasMetadata && (
          <CollapsibleSection label="Metadata" copyText={JSON.stringify(entry.metadata, null, 2)}>
            <pre className={`detail-message detail-monospace${features.messageScrollable ? ' detail-message--scrollable' : ''}`}>
              {JSON.stringify(entry.metadata, null, 2)}
            </pre>
          </CollapsibleSection>
        )} */}

        <CollapsibleSection label="Raw" grow copyText={tryFormatJson(entry.raw)}>
          <pre className={`detail-message detail-muted detail-monospace${features.messageScrollable ? ' detail-message--scrollable' : ''}`}>{tryFormatJson(entry.raw)}</pre>
        </CollapsibleSection>
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
