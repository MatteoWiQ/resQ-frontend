import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import * as L from 'leaflet';

import { Router, RouterLink } from '@angular/router';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { TranslationKey } from '../../../../core/i18n/strings';
import { ReporteService } from '../../../../core/services/reporte.service';
import { GeolocalizacionService } from '../../../../core/services/geolocalizacion.service';
import { AppHeaderComponent } from '../../../../shared/components/app-header/app-header.component';
import { CENTRO_CIUDAD, ZOOM_CIUDAD } from '../../../../shared/constants/geo';
import { TIPOS_CASO } from '../../../../shared/constants/tipos-caso';
import { Reporte } from '../../../../shared/models/reporte.model';
import {
  COLOR_INSIGNIA,
  Insignia,
  Posicion,
  distanciaKm,
  etiquetaTipo,
  insigniaDe,
  metaCaso,
  tieneUbicacion,
} from '../../../../shared/utils/casos';
import {
  CLAVES_ESTADO,
  ClaveEstado,
  DISTANCIAS_KM,
  ESTADOS_POR_CLAVE,
  ESTADO_POR_DEFECTO,
  Orden,
  Zona,
  aplicarFiltros,
  ordenar,
} from '../../casos-filtros';

export type Vista = 'lista' | 'listaMapa';

/** Espera antes de buscar mientras se escribe. */
export const ESPERA_BUSQUEDA_MS = 350;

const INSIGNIAS_LEYENDA: Insignia[] = ['urgente', 'activo', 'resuelto'];

/**
 * Rediseño: pagina Casos (/casos), lista y mapa juntos.
 *
 * - Una sola barra de filtros: busqueda y estado van al backend; tipo de caso,
 *   distancia y "buscar en esta zona" se aplican en el navegador.
 * - Lista a la izquierda y mapa a la derecha. Los puntos tienen el color de su
 *   estado (con leyenda) y al tocarlos se abre una vista previa con foto.
 * - Animal y Necesita quedan visibles pero deshabilitados hasta que el backend
 *   tenga esos datos.
 * - Las tarjetas y el "Ver caso" de la vista previa abren el detalle (/casos/:id).
 *
 * Reemplaza a la pagina /mapa (HU-15): /mapa redirige aca.
 */
@Component({
  selector: 'app-casos',
  standalone: true,
  imports: [AppHeaderComponent, RouterLink, TranslatePipe],
  templateUrl: './casos.component.html',
  styleUrl: './casos.component.css',
  // Leaflet crea los puntos y la vista previa fuera de la plantilla: los estilos
  // van sin encapsular y todos cuelgan de .casos-page.
  encapsulation: ViewEncapsulation.None,
})
export class CasosComponent implements OnInit, AfterViewInit {
  private readonly reporteService = inject(ReporteService);
  private readonly geo = inject(GeolocalizacionService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  private readonly contenedorMapa = viewChild<ElementRef<HTMLDivElement>>('mapa');

  readonly clavesEstado = CLAVES_ESTADO;
  readonly tipos = TIPOS_CASO;
  readonly distancias = DISTANCIAS_KM;
  readonly insigniasLeyenda = INSIGNIAS_LEYENDA;
  readonly colores = COLOR_INSIGNIA;

  // ---- filtros y vista
  readonly estado = signal<ClaveEstado>(ESTADO_POR_DEFECTO);
  readonly busqueda = signal('');
  readonly tipo = signal<string | null>(null);
  readonly distanciaMaxKm = signal<number | null>(null);
  readonly orden = signal<Orden>('URGENTES');
  readonly zona = signal<Zona | null>(null);
  readonly vista = signal<Vista>('listaMapa');

  // ---- datos
  readonly casos = signal<Reporte[]>([]);
  readonly cargando = signal(true);
  readonly error = signal(false);
  readonly posicion = signal<Posicion | null>(null);
  readonly pidiendoUbicacion = signal(false);
  readonly errorUbicacion = signal('');
  readonly seleccionado = signal<number | null>(null);
  readonly resaltado = signal<number | null>(null);
  readonly mapaMovido = signal(false);

  readonly visibles = computed(() =>
    ordenar(
      aplicarFiltros(this.casos(), {
        tipo: this.tipo(),
        distanciaMaxKm: this.distanciaMaxKm(),
        posicion: this.posicion(),
        zona: this.zona(),
      }),
      this.orden(),
      this.posicion(),
    ),
  );

  readonly hayFiltros = computed(
    () =>
      this.estado() !== ESTADO_POR_DEFECTO ||
      this.busqueda().trim() !== '' ||
      this.tipo() !== null ||
      this.distanciaMaxKm() !== null ||
      this.zona() !== null,
  );

  readonly textoResultados = computed(() => {
    const n = this.visibles().length;
    return n === 1 ? this.translate.t('casos.resultados.uno') : this.translate.t('casos.resultados.varios', { n });
  });

  private readonly consultas = new Subject<{ clave: ClaveEstado; texto: string; intento: number }>();
  private intento = 0;
  private mapa: L.Map | null = null;
  private capaPuntos: L.LayerGroup | null = null;
  private puntos = new Map<number, L.Marker>();
  private ajusteProgramatico = false;
  private vistaPrevia: L.Popup | null = null;

  constructor() {
    // En pantallas angostas se empieza por la lista; el mapa queda a un toque.
    try {
      if (typeof matchMedia === 'function' && matchMedia('(max-width: 900px)').matches) {
        this.vista.set('lista');
      }
    } catch {
      // sin matchMedia (pruebas o navegadores viejos) se queda la vista doble
    }

    // Repinta los puntos cuando cambian los casos visibles, la seleccion o el resaltado.
    effect(() => {
      this.visibles();
      this.seleccionado();
      this.resaltado();
      this.pintarPuntos();
    });
  }

  ngOnInit(): void {
    this.consultas
      .pipe(
        distinctUntilChanged((a, b) => a.clave === b.clave && a.texto === b.texto && a.intento === b.intento),
        tap(() => {
          this.cargando.set(true);
          this.error.set(false);
        }),
        switchMap(({ clave, texto }) =>
          this.reporteService.obtenerTodos(ESTADOS_POR_CLAVE[clave], { busqueda: texto }).pipe(
            map((casos) => ({ casos, error: false })),
            catchError(() => of({ casos: [] as Reporte[], error: true })),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ casos, error }) => {
        this.casos.set(casos);
        this.error.set(error);
        this.cargando.set(false);
        if (this.seleccionado() !== null && !casos.some((c) => c.idReporte === this.seleccionado())) {
          this.seleccionado.set(null);
        }
        this.ajustarMapa();
      });

    this.textoBuscado
      .pipe(debounceTime(ESPERA_BUSQUEDA_MS), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.consultar());

    this.consultar();
  }

  ngAfterViewInit(): void {
    this.iniciarMapa();
    this.destroyRef.onDestroy(() => {
      this.mapa?.remove();
      this.mapa = null;
    });
  }

  // ============================================================ filtros

  private readonly textoBuscado = new Subject<void>();

  alBuscar(texto: string): void {
    this.busqueda.set(texto);
    this.textoBuscado.next();
  }

  cambiarEstado(clave: string): void {
    this.estado.set(clave as ClaveEstado);
    this.consultar();
  }

  cambiarTipo(tipo: string): void {
    this.tipo.set(tipo || null);
  }

  cambiarDistancia(valor: string): void {
    const km = valor ? Number(valor) : null;
    if (km === null) {
      this.distanciaMaxKm.set(null);
      return;
    }
    this.conPosicion(() => this.distanciaMaxKm.set(km), () => this.distanciaMaxKm.set(null));
  }

  cambiarOrden(valor: string): void {
    const orden = valor as Orden;
    if (orden !== 'CERCANOS') {
      this.orden.set(orden);
      return;
    }
    this.conPosicion(() => this.orden.set('CERCANOS'), () => this.orden.set('URGENTES'));
  }

  /** Repite la ultima consulta (despues de un error). */
  reintentar(): void {
    this.intento += 1;
    this.consultar();
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.tipo.set(null);
    this.distanciaMaxKm.set(null);
    this.zona.set(null);
    this.estado.set(ESTADO_POR_DEFECTO);
    this.consultar();
  }

  cambiarVista(vista: Vista): void {
    this.vista.set(vista);
    // El mapa estuvo oculto: Leaflet necesita volver a medir su contenedor.
    setTimeout(() => this.mapa?.invalidateSize());
  }

  buscarEnZona(): void {
    const limites = this.mapa?.getBounds();
    if (!limites) {
      return;
    }
    this.zona.set({
      sur: limites.getSouth(),
      oeste: limites.getWest(),
      norte: limites.getNorth(),
      este: limites.getEast(),
    });
    this.mapaMovido.set(false);
  }

  quitarZona(): void {
    this.zona.set(null);
    this.ajustarMapa();
  }

  // ============================================================ lista

  resaltar(idReporte: number | null): void {
    this.resaltado.set(idReporte);
  }

  insignia(caso: Reporte): Insignia {
    return insigniaDe(caso);
  }

  etiquetaInsignia(insignia: Insignia): string {
    return this.translate.t(`casos.insignias.${insignia}`);
  }

  etiquetaEstado(clave: ClaveEstado): string {
    return this.translate.t(`casos.estados.${clave}`);
  }

  etiquetaTipo(tipo: string): string {
    return etiquetaTipo(tipo, this.t);
  }

  meta(caso: Reporte): string {
    const posicion = this.posicion();
    const km = posicion && tieneUbicacion(caso) ? distanciaKm(posicion, caso) : null;
    return metaCaso(caso, this.t, new Date(), km);
  }

  // ============================================================ mapa

  private iniciarMapa(): void {
    const contenedor = this.contenedorMapa()?.nativeElement;
    if (!contenedor || this.mapa) {
      return;
    }
    this.mapa = L.map(contenedor, { zoomControl: true, scrollWheelZoom: true }).setView(CENTRO_CIUDAD, ZOOM_CIUDAD);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.mapa);
    this.capaPuntos = L.layerGroup().addTo(this.mapa);

    // "Buscar en esta zona" aparece solo cuando la persona movio el mapa.
    this.mapa.on('moveend', () => {
      if (this.ajusteProgramatico) {
        this.ajusteProgramatico = false;
        return;
      }
      this.mapaMovido.set(true);
    });
    this.mapa.on('popupclose', (e: L.PopupEvent) => {
      // Al abrir otra vista previa se cierra la anterior: solo se deselecciona si
      // la que se cerro es la del caso seleccionado.
      if (e.popup === this.vistaPrevia) {
        this.vistaPrevia = null;
        this.seleccionado.set(null);
      }
    });

    this.pintarPuntos();
    this.ajustarMapa();
  }

  private pintarPuntos(): void {
    if (!this.mapa || !this.capaPuntos) {
      return;
    }
    this.capaPuntos.clearLayers();
    this.puntos.clear();
    for (const caso of this.visibles()) {
      if (!tieneUbicacion(caso)) {
        continue;
      }
      const punto = L.marker([caso.latitud, caso.longitud], {
        icon: this.icono(caso),
        keyboard: true,
        title: caso.descripcion,
        riseOnHover: true,
        zIndexOffset: caso.idReporte === this.seleccionado() ? 1000 : 0,
      });
      punto.on('click', () => {
        this.seleccionado.set(caso.idReporte);
        this.abrirVistaPrevia(caso);
      });
      punto.addTo(this.capaPuntos);
      this.puntos.set(caso.idReporte, punto);
    }
  }

  /** Centra el mapa en los casos visibles (o en la ciudad si no hay). */
  private ajustarMapa(): void {
    if (!this.mapa || this.zona()) {
      return;
    }
    const conUbicacion = this.visibles().filter(tieneUbicacion);
    this.ajusteProgramatico = true;
    if (conUbicacion.length === 0) {
      this.mapa.setView(CENTRO_CIUDAD, ZOOM_CIUDAD);
    } else {
      const limites = L.latLngBounds(conUbicacion.map((c) => [c.latitud, c.longitud] as [number, number]));
      this.mapa.fitBounds(limites.pad(0.2), { maxZoom: 15 });
    }
    this.mapaMovido.set(false);
  }

  private icono(caso: Reporte): L.DivIcon {
    const insignia = insigniaDe(caso);
    const clases = ['punto-caso', `punto-${insignia}`];
    if (caso.idReporte === this.seleccionado()) {
      clases.push('seleccionado');
    }
    if (caso.idReporte === this.resaltado()) {
      clases.push('resaltado');
    }
    const texto = this.translate.t('casos.mapa.marcador', {
      titulo: caso.descripcion,
      estado: this.etiquetaInsignia(insignia),
    });
    return L.divIcon({
      className: 'punto-caso-icono',
      html: `<span class="${clases.join(' ')}"><span class="visually-hidden">${escaparHtml(texto)}</span></span>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  }

  /** Vista previa con foto. Se arma con nodos (no HTML) porque el texto lo escribe la gente. */
  private abrirVistaPrevia(caso: Reporte): void {
    if (!this.mapa || !tieneUbicacion(caso)) {
      return;
    }
    const tarjeta = document.createElement('div');
    tarjeta.className = 'vista-previa';
    if (caso.fotoUrl) {
      const foto = document.createElement('img');
      foto.className = 'vista-previa-foto';
      foto.src = caso.fotoUrl;
      foto.alt = '';
      tarjeta.appendChild(foto);
    }
    const insignia = insigniaDe(caso);
    const etiqueta = document.createElement('span');
    etiqueta.className = `insignia-caso ${insignia}`;
    etiqueta.textContent = this.etiquetaInsignia(insignia);
    const titulo = document.createElement('p');
    titulo.className = 'vista-previa-titulo';
    titulo.textContent = caso.descripcion;
    const meta = document.createElement('p');
    meta.className = 'vista-previa-meta';
    meta.textContent = this.meta(caso);
    const verCaso = document.createElement('a');
    verCaso.className = 'vista-previa-enlace';
    verCaso.href = `/casos/${caso.idReporte}`;
    verCaso.textContent = this.translate.t('casos.mapa.verCaso');
    verCaso.addEventListener('click', (evento) => {
      evento.preventDefault();
      void this.router.navigate(['/casos', caso.idReporte]);
    });
    const texto = document.createElement('div');
    texto.className = 'vista-previa-texto';
    texto.append(etiqueta, titulo, meta, verCaso);
    tarjeta.appendChild(texto);

    this.ajusteProgramatico = true;
    this.vistaPrevia = L.popup({ className: 'popup-caso', maxWidth: 280, minWidth: 240, autoPanPadding: [24, 24] })
      .setLatLng([caso.latitud, caso.longitud])
      .setContent(tarjeta);
    this.vistaPrevia.openOn(this.mapa);
  }

  // ============================================================ apoyo

  private consultar(): void {
    this.consultas.next({ clave: this.estado(), texto: this.busqueda().trim(), intento: this.intento });
  }

  /** Pide la ubicacion una sola vez; si no se puede, deshace el filtro elegido. */
  private conPosicion(siHay: () => void, siNo: () => void): void {
    if (this.posicion()) {
      siHay();
      return;
    }
    this.pidiendoUbicacion.set(true);
    this.errorUbicacion.set('');
    this.geo.obtenerPosicionActual().subscribe({
      next: (posicion) => {
        this.pidiendoUbicacion.set(false);
        this.posicion.set(posicion);
        siHay();
      },
      error: () => {
        this.pidiendoUbicacion.set(false);
        this.errorUbicacion.set(this.translate.t('casos.ubicacion.denegada'));
        siNo();
      },
    });
  }

  private readonly t = (clave: string, params?: Record<string, string | number>) =>
    this.translate.t(clave as TranslationKey, params);
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
