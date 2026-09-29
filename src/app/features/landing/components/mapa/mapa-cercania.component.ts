import { Component, OnDestroy, inject, input, output, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import {
  ErrorGeolocalizacion,
  GeolocalizacionService,
} from '../../../../core/services/geolocalizacion.service';
import {
  ClaveRadio,
  RADIOS_CERCANIA,
  ReporteCercano,
} from '../../../../shared/constants/cercania';
import { Punto, colorEstado } from '../../../../shared/constants/geo';
import { EstadoReporte, Reporte } from '../../../../shared/models/reporte.model';
import { Traducir, formatearDistancia } from '../../../../shared/utils/distancia';

@Component({
  selector: 'app-mapa-cercania',
  imports: [TranslatePipe],
  templateUrl: './mapa-cercania.component.html',
  styleUrl: './mapa-cercania.component.css',
})
export class MapaCercaniaComponent implements OnDestroy {
  /** Origen de la busqueda. Lo decide el mapa porque tambien lo necesita para pintar. */
  readonly origen = input<Punto | null>(null);
  readonly radioActivo = input<ClaveRadio>('SIN_LIMITE');
  readonly casos = input<ReporteCercano[]>([]);

  readonly origenCambiado = output<Punto | null>();
  readonly radioSeleccionado = output<ClaveRadio>();
  readonly limpiar = output<void>();
  /** El detalle vive en el mapa, asi que la lista delega la seleccion. */
  readonly reporteElegido = output<Reporte>();

  readonly radios = RADIOS_CERCANIA;
  readonly obteniendo = signal(false);
  readonly error = signal<string | null>(null);

  private readonly translate = inject(TranslateService);
  private readonly geolocalizacion = inject(GeolocalizacionService);
  private readonly traducir: Traducir = (clave, params) => this.translate.t(clave, params);

  private solicitud?: Subscription;

  ngOnDestroy(): void {
    this.solicitud?.unsubscribe();
  }

  buscando(): boolean {
    return this.origen() !== null;
  }

  radioActivoEs(clave: ClaveRadio): boolean {
    return this.radioActivo() === clave;
  }

  etiquetaRadio(clave: ClaveRadio): string {
    return this.translate.t(`landing.mapa.cercania.radio.${clave}`);
  }

  etiquetaEstado(estado: EstadoReporte): string {
    return this.translate.t(`landing.mapa.estados.${estado}`);
  }

  colorEstado(estado: EstadoReporte): string {
    return colorEstado(estado);
  }

  formatoDistancia(distanciaKm: number | null): string {
    return formatearDistancia(distanciaKm, this.traducir);
  }

  usarMiUbicacion(): void {
    if (this.obteniendo()) {
      return;
    }

    this.solicitud?.unsubscribe();
    this.error.set(null);
    this.obteniendo.set(true);

    this.solicitud = this.geolocalizacion.obtenerPosicionActual().subscribe({
      next: (posicion) => {
        this.obteniendo.set(false);
        this.origenCambiado.emit(posicion);
      },
      error: (fallo: unknown) => {
        this.obteniendo.set(false);
        this.error.set(this.mensajeDeFalla(fallo));
      },
    });
  }

  seleccionarRadio(clave: ClaveRadio): void {
    this.radioSeleccionado.emit(clave);
  }

  pedirLimpiar(): void {
    this.error.set(null);
    this.solicitud?.unsubscribe();
    this.limpiar.emit();
  }

  private mensajeDeFalla(fallo: unknown): string {
    const motivo =
      fallo instanceof ErrorGeolocalizacion ? fallo.motivo : ('ERROR_DESCONOCIDO' as const);
    return this.translate.t(`landing.mapa.cercania.error.${motivo}`);
  }
}
