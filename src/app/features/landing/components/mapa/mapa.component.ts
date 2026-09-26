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
import { ReporteService } from '../../../../core/services/reporte.service';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { CENTRO_CIUDAD, ESTADOS, ZOOM_CIUDAD, colorEstado } from '../../../../shared/constants/geo';
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

  @ViewChild('mapContainer') private mapContainer!: ElementRef<HTMLDivElement>;

  readonly reportes = signal<Reporte[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly reporteSeleccionado = signal<Reporte | null>(null);

  readonly reportesConUbicacion = computed(() =>
    this.reportes().filter((r) => r.latitud != null && r.longitud != null)
  );
  readonly estados = ESTADOS;

  private mapa?: L.Map;
  private marcadores: L.Marker[] = [];

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

    this.reporteService.obtenerTodos().subscribe({
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

    this.reportesConUbicacion().forEach((reporte) => {
      const marcador = L.marker([reporte.latitud as number, reporte.longitud as number], {
        icon: this.crearIcono(reporte),
      }).addTo(this.mapa as L.Map);

      marcador.on('click', () => this.seleccionarReporte(reporte));
      marcador.bindTooltip(
        `#${reporte.idReporte} · ${this.etiquetaEstado(reporte.estado)}`,
        { direction: 'top', offset: [0, -30] }
      );

      this.marcadores.push(marcador);
    });

    if (this.marcadores.length > 0) {
      const grupo = L.featureGroup(this.marcadores);
      this.mapa.fitBounds(grupo.getBounds().pad(0.15));
    }
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
}
