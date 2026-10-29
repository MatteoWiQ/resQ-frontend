import { Injectable, signal } from '@angular/core';

import {
  getTranslation,
  es,
  en,
  StringCatalog,
  TranslationKey,
} from './strings';

export type TranslateParams = Record<string, string | number>;

@Injectable({ providedIn: 'root' })
export class TranslateService {
  private readonly catalogs = new Map<string, StringCatalog>([['es', es], ['en', en]]);
  private readonly catalog = signal<StringCatalog>(es);
  readonly lang = signal('es');

  constructor() {
    const saved = localStorage.getItem('resq-lang');
    if (saved && this.catalogs.has(saved)) {
      this.catalog.set(this.catalogs.get(saved)!);
      this.lang.set(saved);
    }
  }

  t(key: TranslationKey, params?: TranslateParams): string {
    const catalog = this.catalog();
    const value = getTranslation(key, catalog, params);
    // El catalogo ingles aun es parcial: si falta la clave, cae al espanol.
    if (value === key && catalog !== es) {
      return getTranslation(key, es, params);
    }
    return value;
  }

  setLang(lang: string): void {
    const catalog = this.catalogs.get(lang);
    if (!catalog) {
      return;
    }
    this.catalog.set(catalog);
    this.lang.set(lang);
    localStorage.setItem('resq-lang', lang);
  }

  registerLang(lang: string, catalog: StringCatalog): void {
    this.catalogs.set(lang, catalog);
  }
}