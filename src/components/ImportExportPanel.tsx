import { useRef } from 'react';
import { useFeatures } from '../lib/FeaturesContext';

interface ImportExportPanelProps {
  totalEntries: number;
  filteredEntries: number;
  onExport: () => void;
  onExportAll: () => void;
  onExportBundle: () => void;
  onImportBundle: (file: File) => void;
  onClose: () => void;
}

export default function ImportExportPanel({ totalEntries, filteredEntries, onExport, onExportAll, onExportBundle, onImportBundle, onClose }: ImportExportPanelProps) {
  const { features } = useFeatures();
  const bundleInputRef = useRef<HTMLInputElement>(null);

  const wrap = (fn: () => void) => () => { fn(); onClose(); };

  return (
    <div className="import-export-panel">
      <h3 className="import-export-heading">Import / Export</h3>
      <div className="import-export-group">
        {filteredEntries !== 0 || totalEntries !== 0 && (<div className="import-export-group-label">Log Entries</div>)}
        {filteredEntries > 0 && (
          <button onClick={wrap(onExport)} className="add-filter-btn" title="Export filtered entries as JSON">
            📥 Filtered ({filteredEntries.toLocaleString()})
          </button>
        )}
        {totalEntries > 0 && (
          <button onClick={wrap(onExportAll)} className="add-filter-btn" title="Export all entries as JSON">
            📥 All ({totalEntries.toLocaleString()})
          </button>
        )}
        {/* {filteredEntries === 0 && totalEntries === 0 && (
          <span className="import-export-empty">No entries loaded</span>
        )} */}
      </div>
      {features.supportBundle && (
        <div className="import-export-group">
          <div className="import-export-group-label">Support Bundle</div>
          {totalEntries > 0 && (
            <button onClick={wrap(onExportBundle)} className="add-filter-btn" title="Export support bundle">
              📦 Export bundle
            </button>
          )}
          <input
            ref={bundleInputRef}
            type="file"
            accept=".zip,.json"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) { onImportBundle(f); onClose(); } e.target.value = ''; }}
          />
          <button onClick={() => bundleInputRef.current?.click()} className="add-filter-btn" title="Import support bundle">
            📦 Import bundle
          </button>
        </div>
      )}
    </div>
  );
}
