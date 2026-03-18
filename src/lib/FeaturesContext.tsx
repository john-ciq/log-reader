import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Features, FeatureKey, featureDefaults, featureDefinitions, loadFeatureOverrides, saveFeatureOverrides } from './features';
import { loadSourcesState, saveSourcesState } from './statistics';

interface FeaturesContextValue {
  features: Features;
  setFeature: (key: FeatureKey, value: boolean) => void;
  resetFeatures: () => void;
}

const FeaturesContext = createContext<FeaturesContextValue | null>(null);

export function FeaturesProvider({ children }: { children: ReactNode }) {
  const [features, setFeatures] = useState<Features>(() => ({
    ...featureDefaults,
    ...loadFeatureOverrides(),
  }));

  const setFeature = (key: FeatureKey, value: boolean) => {
    setFeatures(prev => {
      const next = { ...prev, [key]: value };
      // Only persist values that differ from defaults
      const overrides: Partial<Features> = {};
      (Object.keys(next) as FeatureKey[]).forEach(k => {
        if (next[k] !== featureDefaults[k]) overrides[k] = next[k];
      });
      saveFeatureOverrides(overrides);
      return next;
    });
  };

  const resetFeatures = () => {
    saveFeatureOverrides({});
    setFeatures({ ...featureDefaults });
    saveSourcesState('', 'name', 'asc');
  };

  useEffect(() => {
    (window as unknown as Record<string, unknown>).__features = {
      list: (hidden = false) => {
        const rows = (Object.keys(featureDefinitions) as FeatureKey[])
          .filter(k => featureDefinitions[k].visible === !hidden)
          .map(k => ({
            key: k,
            name: featureDefinitions[k].name,
            value: features[k],
            default: featureDefaults[k],
          }));
        console.table(rows);
        return rows;
      },
      set: (key: FeatureKey, value: boolean) => {
        if (!(key in featureDefinitions)) { console.error(`Unknown feature: "${key}"`); return; }
        setFeature(key, value);
        console.log(`[features] ${key} = ${value}`);
      },
      toggle: (key: FeatureKey) => {
        if (!(key in featureDefinitions)) { console.error(`Unknown feature: "${key}"`); return; }
        const next = !features[key];
        setFeature(key, next);
        console.log(`[features] ${key} = ${next}`);
      },
      reset: () => { resetFeatures(); console.log('[features] reset to defaults'); },
      help: () => console.log(
        '__features — manage app feature flags\n\n' +
        '  __features.list()           — print visible features\n' +
        '  __features.pick()           — print the list and prompt to toggle\n' +
        '  __features.toggle(key)      — toggle a feature by its key, e.g. __features.toggle("deduplication")\n' +
        '  __features.set(key, value)  — set a feature to true or false, e.g. __features.set("timeRange", false)\n' +
        '  __features.reset()          — reset all features to their default values\n' +
        '  __features.help()           — show this message'
      ),
      pick: (hidden = false) => {
        const keys = (Object.keys(featureDefinitions) as FeatureKey[]).filter(k => featureDefinitions[k].visible === !hidden);
        const lines = keys.map((k, i) =>
          `  ${String(i + 1).padStart(2)}. ${featureDefinitions[k].name} (${k})\n      ${featureDefinitions[k].description}`
        );
        console.log('Features:\n' + lines.join('\n'));
        const input = prompt('Enter feature number or key to toggle:');
        if (!input) return;
        const trimmed = input.trim();
        const byIndex = parseInt(trimmed, 10);
        const key = !isNaN(byIndex) ? keys[byIndex - 1] : trimmed as FeatureKey;
        if (!key || !(key in featureDefinitions)) { console.error(`Unknown feature: "${trimmed}"`); return; }
        const next = !features[key];
        setFeature(key, next);
        console.log(`[features] ${key} = ${next}`);
      },
    };
    return () => { delete (window as unknown as Record<string, unknown>).__features; };
  }, [features, setFeature, resetFeatures]);

  return (
    <FeaturesContext.Provider value={{ features, setFeature, resetFeatures }}>
      {children}
    </FeaturesContext.Provider>
  );
}

export function useFeatures(): FeaturesContextValue {
  const ctx = useContext(FeaturesContext);
  if (!ctx) throw new Error('useFeatures must be used within FeaturesProvider');
  return ctx;
}
