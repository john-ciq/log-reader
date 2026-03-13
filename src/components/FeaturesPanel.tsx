import { useFeatures } from '../lib/FeaturesContext';
import { FeatureKey, featureDefinitions } from '../lib/features';

interface FeaturesPanelProps {
  onClose: () => void;
}

export default function FeaturesPanel({ onClose }: FeaturesPanelProps) {
  const { features, setFeature, resetFeatures } = useFeatures();

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
      </div>
    </div>
  );
}
