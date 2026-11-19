import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

/** Pie de pagina del Inicio. */
@Component({
  selector: 'app-landing-pie',
  imports: [RouterLink, TranslatePipe],
  template: `
    <footer class="pie">
      <div>
        <span class="pie-marca">{{ 'shared.brand.nombre' | translate }}</span>
        <p>{{ 'inicio.pie.lema' | translate }}</p>
      </div>
      <nav [attr.aria-label]="'inicio.pie.ariaLabel' | translate">
        <a routerLink="/" fragment="ayudar">{{ 'inicio.pie.comoAyudar' | translate }}</a>
        <a routerLink="/organizaciones/registro">{{ 'inicio.pie.organizaciones' | translate }}</a>
        <a routerLink="/guia-reporte">{{ 'inicio.pie.guia' | translate }}</a>
      </nav>
    </footer>
  `,
  styles: `
    .pie {
      margin-top: 64px;
      padding: 28px 0 8px;
      border-top: 1px solid var(--border);
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .pie-marca {
      font-family: var(--font-titulos);
      font-weight: 800;
      font-size: 22px;
      color: var(--primary-strong);
    }

    .pie p {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 14px;
    }

    nav {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 20px;
    }

    nav a {
      padding: 6px 0;
      color: var(--text);
      font-size: 15px;
      text-decoration: none;
    }

    nav a:hover {
      color: var(--primary);
      text-decoration: underline;
    }
  `,
})
export class LandingPie {}
