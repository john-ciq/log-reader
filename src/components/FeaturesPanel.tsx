import { useFeatures } from '../lib/FeaturesContext';
import { FeatureKey, featureDescriptions } from '../lib/features';

interface FeaturesPanelProps {
  onClose: () => void;
}

export default function FeaturesPanel({ onClose }: FeaturesPanelProps) {
  const { features, setFeature } = useFeatures();

  return (
    <div className="features-panel-overlay" onClick={onClose}>
      <div className="features-panel" onClick={e => e.stopPropagation()}>
        <div className="features-panel-header">
          <h3>Features</h3>
          <button className="features-panel-close" onClick={onClose}>✕</button>
        </div>
        <div className="features-panel-body">
          {(Object.keys(featureDescriptions) as FeatureKey[]).map(key => (
            <label key={key} className="feature-row">
              <input
                type="checkbox"
                checked={features[key]}
                onChange={e => setFeature(key, e.target.checked)}
              />
              <span className="feature-description">{featureDescriptions[key]}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
