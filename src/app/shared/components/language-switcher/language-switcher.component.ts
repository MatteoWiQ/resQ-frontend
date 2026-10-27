import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '../../../core/i18n/translate.service';

export const LANGUAGES = ['es', 'en'] as const;
export type Language = typeof LANGUAGES[number];

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [],
  template: `
    <div class="language-switcher" aria-label="Cambiar idioma / Change language">
      <span class="current-lang">
        @if (translateService.lang() === 'es') {
          ES
        } @else {
          EN
        }
      </span>
      <button class="lang-btn" (click)="setLang('es')">ES</button>
      <button class="lang-btn" (click)="setLang('en')">EN</button>
    </div>
  `,
  styles: [
    `
      .language-switcher {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        .current-lang {
          margin-right: 4px;
        }
        .lang-btn {
          padding: 4px 8px;
          border: 1px solid currentColor;
          border-radius: 4px;
          cursor: pointer;
          &:focus-visible {
            outline: 2px solid var(--primary-color);
            outline-offset: 2px;
          }
        }
        .lang-btn.active {
          background-color: var(--primary-color);
          color: white;
        }
      }
    `,
  ],
})
export class LanguageSwitcherComponent {
  private readonly translateService = inject(TranslateService);

  setLang(lang: Language): void {
    this.translateService.setLang(lang);
  }
}