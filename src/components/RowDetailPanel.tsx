import { useEffect, useState } from 'react';
import { LogEntry } from '../lib/parser';
import { useFeatures } from '../lib/FeaturesContext';
import { storage } from '../lib/local-storage';

interface RowDetailPanelProps {
  entry: LogEntry | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  sidebar?: boolean;
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

function DetailBody({ entry, onClose, onPrev, onNext, hasPrev, hasNext, sidebar }: Omit<RowDetailPanelProps, 'dialog'> & { entry: LogEntry }) {
  const { features, setFeature } = useFeatures();
  const hasMetadata = entry.metadata && Object.keys(entry.metadata).length > 0;
  return (
    <>
      <div className="detail-panel-header">
        <span className="detail-panel-title">Entry Detail</span>
        <div className="detail-panel-nav">
          <button onClick={onPrev} disabled={!hasPrev} title="Previous entry (←)">‹</button>
          <button onClick={onNext} disabled={!hasNext} title="Next entry (→)">›</button>
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

        {entry.parser && (
          <div className="detail-field">
            <span className="detail-field-label">Parser</span>
            <span className="detail-field-value detail-muted">{entry.parser}</span>
          </div>
        )}

        <CollapsibleSection label="Message" copyText={entry.message}>
          <pre className="detail-message">{entry.message}</pre>
        </CollapsibleSection>

        {hasMetadata && (
          <CollapsibleSection label="Metadata" copyText={JSON.stringify(entry.metadata, null, 2)}>
            <pre className="detail-message detail-monospace">
              {JSON.stringify(entry.metadata, null, 2)}
            </pre>
          </CollapsibleSection>
        )}

        <CollapsibleSection label="Raw" grow copyText={entry.raw}>
          <pre className="detail-message detail-muted detail-monospace">{entry.raw}</pre>
        </CollapsibleSection>
      </div>
    </>
  );
}

export default function RowDetailPanel({ entry, onClose, onPrev, onNext, hasPrev, hasNext, sidebar }: RowDetailPanelProps) {
  useEffect(() => {
    if (!entry) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sidebar) onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [entry, onClose, onPrev, onNext, hasPrev, hasNext, sidebar]);

  if (sidebar) {
    return (
      <aside className="row-detail-sidebar">
        {entry ? (
          <DetailBody entry={entry} onClose={onClose} onPrev={onPrev} onNext={onNext} hasPrev={hasPrev} hasNext={hasNext} sidebar />
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
        <DetailBody entry={entry} onClose={onClose} onPrev={onPrev} onNext={onNext} hasPrev={hasPrev} hasNext={hasNext} />
      </div>
    </>
  );
}
