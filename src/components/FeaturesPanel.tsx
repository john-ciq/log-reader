import { useRef, useState, useEffect } from 'react';
import { useFeatures } from '../lib/FeaturesContext';
import { FeatureKey, featureDefinitions } from '../lib/features';
import { Theme, loadTheme, saveTheme, applyTheme } from '../lib/theme';
import { downloadTimestamp } from '../lib/utils';
import { storage } from '../lib/local-storage';
import pkg from '../../package.json';

interface FeaturesPanelProps {
  onClose: () => void;
}

function exportStorage() {
  const data: Record<string, string> = { __version: pkg.version, ...storage.exportAllData() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `full-view-settings-${downloadTimestamp()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function FeaturesPanel({ onClose }: FeaturesPanelProps) {
  const { features, setFeature, resetFeatures } = useFeatures();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [theme, setThemeState] = useState<Theme>(loadTheme);
  const [showRefreshConfirm, setShowRefreshConfirm] = useState(false);

  const handleThemeChange = (t: Theme) => {
    setThemeState(t);
    saveTheme(t);
    applyTheme(t);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as Record<string, string>;
        storage.importAllData(data);
        window.location.reload();
      } catch {
        alert('Failed to import settings: invalid file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
    {showRefreshConfirm && (
      <div className="confirm-dialog-overlay">
        <div className="confirm-dialog">
          <p className="confirm-dialog-message">Settings have been reset. Refresh the page to apply all changes?</p>
          <div className="confirm-dialog-actions">
            <button className="confirm-dialog-btn confirm-dialog-btn--secondary" onClick={() => setShowRefreshConfirm(false)}>Later</button>
            <button className="confirm-dialog-btn confirm-dialog-btn--primary" onClick={() => window.location.reload()}>Refresh now</button>
          </div>
        </div>
      </div>
    )}
    <div className="features-panel-overlay" onClick={onClose}>
      <div className="features-panel" onClick={e => e.stopPropagation()}>
        <div className="features-panel-header">
          <h3>Features</h3>
            <button className="features-panel-reset" onClick={() => { resetFeatures(); handleThemeChange('system'); setShowRefreshConfirm(true); }}>Reset</button>
          <button className="features-panel-close" onClick={onClose}>✕</button>
        </div>
        <div className="features-panel-body">
          <div className="theme-selector">
            <span className="theme-label">Theme</span>
            <div className="theme-options">
              {(['dark', 'light', 'system'] as Theme[]).map(t => (
                <label key={t} className={`theme-option${theme === t ? ' active' : ''}`}>
                  <input type="radio" name="theme" value={t} checked={theme === t} onChange={() => handleThemeChange(t)} />
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </label>
              ))}
            </div>
          </div>
          <hr className="features-divider" />
          {(Object.keys(featureDefinitions) as FeatureKey[])
            .filter(key => featureDefinitions[key].visible)
            .map(key => (
              <label key={key} className="feature-row">
                <input
                  type="checkbox"
                  checked={features[key]}
                  onChange={e => setFeature(key, e.target.checked)}
                />
                <span className="feature-text">
                  <span className="feature-name">{featureDefinitions[key].name}</span>
                  <span className="feature-description">{featureDefinitions[key].description}</span>
                </span>
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
    </>
  );
}
