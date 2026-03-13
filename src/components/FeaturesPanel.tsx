import { useRef } from 'react';
import { useFeatures } from '../lib/FeaturesContext';
import { FeatureKey, featureDefinitions } from '../lib/features';

interface FeaturesPanelProps {
  onClose: () => void;
}

function exportStorage() {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!;
    data[key] = localStorage.getItem(key)!;
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'log-reader-settings.json';
  a.click();
  URL.revokeObjectURL(url);
}

export default function FeaturesPanel({ onClose }: FeaturesPanelProps) {
  const { features, setFeature, resetFeatures } = useFeatures();
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as Record<string, string>;
        Object.entries(data).forEach(([key, value]) => localStorage.setItem(key, value));
        window.location.reload();
      } catch {
        alert('Failed to import settings: invalid file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="features-panel-overlay" onClick={onClose}>
      <div className="features-panel" onClick={e => e.stopPropagation()}>
        <div className="features-panel-header">
          <h3>Features</h3>
          <button className="features-panel-reset" onClick={resetFeatures}>Reset</button>
          <button className="features-panel-close" onClick={onClose}>✕</button>
        </div>
        <div className="features-panel-body">
          {(Object.keys(featureDefinitions) as FeatureKey[])
            .filter(key => featureDefinitions[key].visible)
            .map(key => (
              <label key={key} className="feature-row">
                <input
                  type="checkbox"
                  checked={features[key]}
                  onChange={e => setFeature(key, e.target.checked)}
                />
                <span className="feature-description">{featureDefinitions[key].description}</span>
              </label>
            ))}
        </div>
        {features.importExportStorage && (
          <div className="features-panel-footer">
            <input ref={importInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
            <button className="features-io-btn" onClick={() => importInputRef.current?.click()}>Import</button>
            <button className="features-io-btn" onClick={exportStorage}>Export</button>
          </div>
        )}
      </div>
    </div>
  );
}
