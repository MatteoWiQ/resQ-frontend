import { Injectable, signal } from '@angular/core';

import {
  getTranslation,
  es,
  StringCatalog,
  TranslationKey,
} from './strings';

export type TranslateParams = Record<string, string | number>;

@Injectable({ providedIn: 'root' })
export class TranslateService {
  private readonly catalogs = new Map<string, StringCatalog>([['es', es]]);
  private readonly catalog = signal<StringCatalog>(es);
  readonly lang = signal('es');

  t(key: TranslationKey, params?: TranslateParams): string {
    return getTranslation(key, this.catalog(), params);
  }

  setLang(lang: string): void {
    const catalog = this.catalogs.get(lang);
    if (!catalog) {
      return;
    }
    this.catalog.set(catalog);
    this.lang.set(lang);
  }

  registerLang(lang: string, catalog: StringCatalog): void {
    this.catalogs.set(lang, catalog);
  }
}