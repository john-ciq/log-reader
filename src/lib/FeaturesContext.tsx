import { createContext, useContext, useState, ReactNode } from 'react';
import { Features, FeatureKey, featureDefaults, loadFeatureOverrides, saveFeatureOverrides } from './features';

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
  };

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
