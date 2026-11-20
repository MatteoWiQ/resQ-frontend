import { Component, inject, input, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-adjunto-privado',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (error()) { <span role="alert">{{ 'mensajes.errorCargar' | translate }}</span> }
    @if (blobUrl(); as url) {
      @if (imagen()) { <img [src]="url" [alt]="nombre()" style="max-width:100%;max-height:260px" /> }
      <a [href]="url" [download]="nombre()">{{ nombre() }}</a>
    }
  `,
})
export class AdjuntoPrivadoComponent {
  readonly ruta = input.required<string>();
  readonly nombre = input('archivo');
  readonly imagen = input(false);
  readonly blobUrl = signal<string | null>(null);
  readonly error = signal(false);
  private readonly http = inject(HttpClient);

  constructor() {
    effect((limpiar) => {
      const ruta = this.ruta();
      this.blobUrl.set(null);
      this.error.set(false);
      // Solo descargar desde el endpoint privado de la API, nunca URLs externas.
      if (!/^\/api\/conversaciones\/adjuntos\/[a-zA-Z0-9.-]+$/.test(ruta)) {
        this.error.set(true);
        return;
      }
      let url: string | null = null;
      const sub = this.http.get(ruta, { responseType: 'blob' }).subscribe({
        next: (blob) => { url = URL.createObjectURL(blob); this.blobUrl.set(url); },
        error: () => this.error.set(true),
      });
      limpiar(() => { sub.unsubscribe(); if (url) URL.revokeObjectURL(url); });
    });
  }
}
