import { Injectable, signal, effect } from '@angular/core';
import { DEFAULT_FEATURE_FLAGS, type FeatureFlags, getFeatureFlags } from './config/feature-flags.config';

@Injectable({ providedIn: 'root' })
export class FeatureToggleService {
  private readonly _flags = signal<FeatureFlags>(getFeatureFlags());

  readonly flags = this._flags.asReadonly();

  constructor() {
    // Efecto para persistir cambios en localStorage automáticamente
    effect(() => {
      const current = this._flags();
      if (typeof window !== 'undefined') {
        localStorage.setItem('resq-feature-flags', JSON.stringify(current));
      }
    }, { allowSignalWrites: true });
  }

  /** Devuelve true si la feature está activada */
  isEnabled(key: keyof FeatureFlags): boolean {
    return this._flags()[key];
  }

  /** Activa o desactiva una feature y persiste en localStorage */
  setEnabled(key: keyof FeatureFlags, value: boolean): void {
    this._flags.update((flags) => {
      flags[key] = value;
      return flags;
    });
  }

  /** Restaura todos los flags a los defaults + env overrides */
  reset(): void {
    this._flags.set(getFeatureFlags());
  }
}