import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationKey } from '../../../../core/i18n/strings';

interface FormaDeAyudar {
  clave: 'transporte' | 'hogar' | 'alimento' | 'rescate';
  titulo: TranslationKey;
  descripcion: TranslationKey;
}

/**
 * Inicio: formas de ayudar como lista, cada una con su enlace a los casos.
 * Es el destino de "Como ayudar" en la cabecera (#ayudar).
 */
@Component({
  selector: 'app-landing-help',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './help-section.component.html',
  styleUrl: './help-section.component.css',
})
export class LandingHelpSection {
  readonly formas: FormaDeAyudar[] = [
    { clave: 'transporte', titulo: 'inicio.ayudar.transporte.titulo', descripcion: 'inicio.ayudar.transporte.descripcion' },
    { clave: 'hogar', titulo: 'inicio.ayudar.hogar.titulo', descripcion: 'inicio.ayudar.hogar.descripcion' },
    { clave: 'alimento', titulo: 'inicio.ayudar.alimento.titulo', descripcion: 'inicio.ayudar.alimento.descripcion' },
    { clave: 'rescate', titulo: 'inicio.ayudar.rescate.titulo', descripcion: 'inicio.ayudar.rescate.descripcion' },
  ];
}
