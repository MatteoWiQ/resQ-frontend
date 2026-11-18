
import { Component, inject } from '@angular/core';
import { TranslateService } from '../../../core/i18n/translate.service';

export const LANGUAGES = ['es', 'en'] as const;
export type Language = typeof LANGUAGES[number];

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [],
  template: `
    <div class="idioma-contenedor">

      <div class="idioma-informacion">
        <span class="idioma-titulo">
          {{ translateService.lang() === 'es' ? 'Idioma' : 'Language' }}
        </span>

        <span class="idioma-descripcion">
          {{
            translateService.lang() === 'es'
              ? 'Selecciona tu idioma preferido'
              : 'Choose your preferred language'
          }}
        </span>
      </div>

      <div class="idioma-opciones" role="group"
           [attr.aria-label]="translateService.lang() === 'es'
             ? 'Seleccionar idioma'
             : 'Select language'">

        <button
          type="button"
          class="idioma-btn"
          [class.activo]="translateService.lang() === 'es'"
          [attr.aria-pressed]="translateService.lang() === 'es'"
          (click)="setLang('es')">
          ES
        </button>

        <button
          type="button"
          class="idioma-btn"
          [class.activo]="translateService.lang() === 'en'"
          [attr.aria-pressed]="translateService.lang() === 'en'"
          (click)="setLang('en')">
          EN
        </button>

      </div>
    </div>
  `,
  styles: [`
    .idioma-contenedor {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }

    .idioma-informacion {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .idioma-titulo {
      color: var(--text, #642137);
      font-family: 'Poppins', sans-serif;
      font-size: 0.95rem;
      font-weight: 600;
    }

    .idioma-descripcion {
      color: var(--muted, #886773);
      font-size: 0.82rem;
    }

    .idioma-opciones {
      display: flex;
      align-items: center;
      gap: 5px;
      background: #f8edea;
      padding: 5px;
      border-radius: 50px;
    }

    .idioma-btn {
      border: none;
      background: transparent;
      color: #78233d;
      border-radius: 50px;
      padding: 10px 22px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }

    .idioma-btn:hover:not(.activo) {
      background: #ead3d6;
    }

    .idioma-btn.activo {
      background: #78233d;
      color: #ffffff;
      box-shadow: 0 3px 8px rgba(100, 33, 55, 0.2);
    }

    .idioma-btn:focus-visible {
      outline: 2px solid #78233d;
      outline-offset: 3px;
    }

    @media (max-width: 600px) {
      .idioma-contenedor {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  `],
})
export class LanguageSwitcherComponent {
  public readonly translateService = inject(TranslateService);

  setLang(lang: Language): void {
    this.translateService.setLang(lang);
  }
}
