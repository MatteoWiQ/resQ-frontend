import { DEFAULT_FEATURE_FLAGS, type FeatureFlags } from './feature-flags.model';

export const ENV_FEATURE_FLAGS: Partial<FeatureFlags> = {
  // Overrides por ambiente (development, production, etc.).
  // Ejemplo para dev: desactivar features mientras se testean otros cambios:
  // enableI18n: false,
};

export function getFeatureFlags(): FeatureFlags {
  // Primero los defaults, luego los overrides de entorno, luego localStorage.
  // localStorage toma la prioridad para testing/override manual.
  const stored = typeof window !== 'undefined'
    ? localStorage.getItem('resq-feature-flags')
    : null;

  if (stored) {
    try {
      const parsed: Partial<FeatureFlags> = JSON.parse(stored);
      return { ...DEFAULT_FEATURE_FLAGS, ...ENV_FEATURE_FLAGS, ...parsed };
    } catch {
      // Si no se puede parsear, volvemos a defaults + env
    }
  }

  return { ...DEFAULT_FEATURE_FLAGS, ...ENV_FEATURE_FLAGS };
}