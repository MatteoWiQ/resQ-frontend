import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import * as L from 'leaflet';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import {
  ErrorGeolocalizacion,
  GeolocalizacionService,
} from '../../../../core/services/geolocalizacion.service';
import { ReporteService } from '../../../../core/services/reporte.service';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import {
  CENTRO_CIUDAD,
  ESTADOS,
  Punto,
  ZOOM_CIUDAD,
  colorEstado,
} from '../../../../shared/constants/geo';
import {
  ClaveFiltro,
  FILTROS_REPORTE,
  filtroPorClave,
} from '../../../../shared/constants/filtros-reporte';
import {
  ClaveRadio,
  RADIOS_CERCANIA,
  RADIO_TODOS,
  ReporteCercano,
  dentroDelRadio,
  ordenarPorDistancia,
  radioPorClave,
  reportesConDistancia,
} from '../../../../shared/constants/cercania';
import { EstadoReporte, Reporte } from '../../../../shared/models/reporte.model';

@Component({
  selector: 'app-mapa',
  imports: [CommonModule, TranslatePipe, BackButtonComponent],
  templateUrl: './mapa.component.html',
  styleUrl: './mapa.component.css',
})
export class MapaComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly paginaCompleta = input(true);

  private readonly reporteService = inject(ReporteService);
  private readonly translate = inject(TranslateService);
  private readonly geolocalizacion = inject(GeolocalizacionService);

  @ViewChild('mapContainer') private mapContainer!: ElementRef<HTMLDivElement>;

  readonly reportes = signal<Reporte[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly reporteSeleccionado = signal<Reporte | null>(null);

  readonly reportesConUbicacion = computed(() =>
    this.reportes().filter((r) => r.latitud != null && r.longitud != null)
  );
  readonly estados = ESTADOS;

  // ============ HU15: filtrar casos por estado ============
  readonly filtros = FILTROS_REPORTE;
  readonly filtroActivo = signal<ClaveFiltro>('TODOS');
  readonly etiquetaFiltroActual = computed(
    () => this.translate.t(`reportes.filtros.${this.filtroActivo()}`)
  );

  // ============ HU-41: buscar casos cercanos a mi ubicación ============
  readonly radios = RADIOS_CERCANIA;
  readonly radioActivo = signal<ClaveRadio>('SIN_LIMITE');
  readonly origen = signal<Punto | null>(null);
  readonly obteniendoUbicacion = signal(false);
  readonly errorUbicacion = signal<string | null>(null);

  readonly buscandoPorCercania = computed(() => this.origen() !== null);

  /**
   * Sin origen no hay forma de ordenar, asi que se listan todos los casos con
   * ubicacion y la distancia queda desconocida.
   */
  readonly reportesVisibles = computed<ReporteCercano[]>(() => {
    const origen = this.origen();
    const conUbicacion = this.reportesConUbicacion();

    if (!origen) {
      return conUbicacion.map((reporte) => ({ reporte, distanciaKm: null }));
    }

    const conDistancia = reportesConDistancia(conUbicacion, origen);
    const radioKm = radioPorClave(this.radioActivo()).km;

    return ordenarPorDistancia(dentroDelRadio(conDistancia, radioKm));
  });

  private mapa?: L.Map;
  private marcadores: L.Marker[] = [];
  private marcadorOrigen?: L.Marker;

  ngOnInit(): void {
    this.cargarReportes();
  }

  ngAfterViewInit(): void {
    this.inicializarMapa();
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
  }

  cargarReportes(): void {
    this.cargando.set(true);
    this.error.set(null);

    const { estados } = filtroPorClave(this.filtroActivo());

    this.reporteService.obtenerTodos(estados).subscribe({
      next: (data) => {
        this.reportes.set(data);
        this.cargando.set(false);
        this.pintarMarcadores();
      },
      error: (err) => {
        this.error.set(this.translate.t('landing.mapa.errorCargar', { detalle: err.message }));
        this.cargando.set(false);
      },
    });
  }

  // ============ HU15: cambiar el filtro recarga desde el backend ============
  seleccionarFiltro(clave: ClaveFiltro): void {
    if (this.filtroActivo() === clave) {
      return;
    }

    this.filtroActivo.set(clave);
    this.reporteSeleccionado.set(null);
    this.cargarReportes();
  }

  estaActivo(clave: ClaveFiltro): boolean {
    return this.filtroActivo() === clave;
  }

  seleccionarReporte(reporte: Reporte): void {
    this.reporteSeleccionado.set(reporte);
    this.mapa?.invalidateSize();
  }

  cerrarDetalle(): void {
    this.reporteSeleccionado.set(null);
    this.mapa?.invalidateSize();
  }

  colorEstado(estado: EstadoReporte): string {
    return colorEstado(estado);
  }

  etiquetaEstado(estado: EstadoReporte): string {
    return this.translate.t(`landing.mapa.estados.${estado}`);
  }

  etiquetaFiltro(clave: ClaveFiltro): string {
    return this.translate.t(`reportes.filtros.${clave}`);
  }

  // ============ HU-41: ubicacion actual, radio y alcance ============

  usarMiUbicacion(): void {
    if (this.obteniendoUbicacion()) {
      return;
    }

    this.obteniendoUbicacion.set(true);
    this.errorUbicacion.set(null);

    this.geolocalizacion.obtenerPosicionActual().subscribe({
      next: (posicion) => {
        this.origen.set(posicion);
        this.obteniendoUbicacion.set(false);
        this.centrarEnOrigen();
        this.pintarMarcadores();
      },
      error: (fallo: unknown) => {
        this.obteniendoUbicacion.set(false);
        this.errorUbicacion.set(this.mensajeDeFallaDeUbicacion(fallo));
      },
    });
  }

  seleccionarRadio(clave: ClaveRadio): void {
    if (this.radioActivo() === clave) {
      return;
    }

    this.radioActivo.set(clave);
    this.pintarMarcadores();
  }

  limpiarCercania(): void {
    this.origen.set(null);
    this.radioActivo.set(RADIO_TODOS.clave);
    this.errorUbicacion.set(null);
    this.reporteSeleccionado.set(null);
    this.pintarMarcadores();
  }

  radioActivoEs(clave: ClaveRadio): boolean {
    return this.radioActivo() === clave;
  }

  etiquetaRadio(clave: ClaveRadio): string {
    return this.translate.t(`landing.mapa.cercania.radio.${clave}`);
  }

  /** Distancia del caso respecto al origen activo, si la busqueda esta en curso. */
  distanciaDe(reporte: Reporte): number | null {
    const caso = this.reportesVisibles().find(
      (visible) => visible.reporte.idReporte === reporte.idReporte
    );
    return caso?.distanciaKm ?? null;
  }

  formatoDistancia(distanciaKm: number | null): string {
    if (distanciaKm === null) {
      return this.translate.t('landing.mapa.cercania.distanciaDesconocida');
    }

    if (distanciaKm < 1) {
      return this.translate.t('landing.mapa.cercania.metros', {
        metros: Math.round(distanciaKm * 1000),
      });
    }

    return this.translate.t('landing.mapa.cercania.kilometros', {
      km: distanciaKm.toFixed(1),
    });
  }

  private mensajeDeFallaDeUbicacion(fallo: unknown): string {
    const motivo =
      fallo instanceof ErrorGeolocalizacion ? fallo.motivo : ('ERROR_DESCONOCIDO' as const);
    return this.translate.t(`landing.mapa.cercania.error.${motivo}`);
  }

  private centrarEnOrigen(): void {
    const origen = this.origen();

    if (!origen || !this.mapa) {
      return;
    }

    this.mapa.setView([origen.latitud, origen.longitud], ZOOM_CIUDAD);
  }

  private inicializarMapa(): void {
    if (!this.mapContainer) {
      return;
    }

    this.mapa = L.map(this.mapContainer.nativeElement, {
      center: CENTRO_CIUDAD,
      zoom: ZOOM_CIUDAD,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.mapa);

    this.pintarMarcadores();

    requestAnimationFrame(() => this.mapa?.invalidateSize());
  }

  private pintarMarcadores(): void {
    if (!this.mapa) {
      return;
    }

    this.marcadores.forEach((marcador) => this.mapa?.removeLayer(marcador));
    this.marcadores = [];

    const visibles = this.reportesVisibles();

    visibles.forEach((caso) => {
      const { reporte } = caso;
      const marcador = L.marker([reporte.latitud as number, reporte.longitud as number], {
        icon: this.crearIcono(reporte),
      }).addTo(this.mapa as L.Map);

      marcador.on('click', () => this.seleccionarReporte(reporte));
      marcador.bindTooltip(this.textoMarcador(caso), {
        direction: 'top',
        offset: [0, -30],
      });

      this.marcadores.push(marcador);
    });

    this.pintarOrigen();

    if (this.marcadores.length > 0) {
      const grupo = L.featureGroup(this.marcadores);
      this.mapa.fitBounds(grupo.getBounds().pad(0.15));
    }
  }

  private pintarOrigen(): void {
    const origen = this.origen();

    if (this.marcadorOrigen) {
      this.mapa?.removeLayer(this.marcadorOrigen);
      this.marcadorOrigen = undefined;
    }

    if (!origen) {
      return;
    }

    this.marcadorOrigen = L.marker([origen.latitud, origen.longitud], {
      icon: this.crearIconoOrigen(),
      zIndexOffset: 1000,
      interactive: false,
    }).addTo(this.mapa as L.Map);
  }

  private textoMarcador(caso: ReporteCercano): string {
    const partes = [`#${caso.reporte.idReporte}`, this.etiquetaEstado(caso.reporte.estado)];

    if (caso.distanciaKm !== null) {
      partes.push(this.formatoDistancia(caso.distanciaKm));
    }

    return partes.join(' · ');
  }

  private crearIcono(reporte: Reporte): L.DivIcon {
    const color = this.colorEstado(reporte.estado);
    const texto = this.translate.t('landing.mapa.marcadorTexto', {
      id: reporte.idReporte,
      estado: this.etiquetaEstado(reporte.estado),
    });

    return L.divIcon({
      className: 'resq-marker',
      html: `<span class="resq-marker__pin" style="background-color: ${color}"></span>
             <span class="visually-hidden">${texto}</span>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      tooltipAnchor: [0, -26],
    });
  }

  private crearIconoOrigen(): L.DivIcon {
    const texto = this.translate.t('landing.mapa.cercania.ubicacionActual');

    return L.divIcon({
      className: 'resq-marker resq-marker--origen',
      html: `<span class="resq-marker__origen"></span>
             <span class="visually-hidden">${texto}</span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  }
}
