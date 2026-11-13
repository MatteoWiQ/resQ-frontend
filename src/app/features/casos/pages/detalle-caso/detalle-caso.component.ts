import {
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
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import * as L from 'leaflet';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { TranslationKey } from '../../../../core/i18n/strings';
import { AuthService } from '../../../../core/services/auth.service';
import { GeolocalizacionService } from '../../../../core/services/geolocalizacion.service';
import { MensajeService } from '../../../../core/services/mensaje.service';
import { OrganizacionService } from '../../../../core/services/organizacion.service';
import { ReporteService } from '../../../../core/services/reporte.service';
import { AppHeaderComponent } from '../../../../shared/components/app-header/app-header.component';
import { Organizacion } from '../../../../shared/models/organizacion.model';
import { ContactoReporte, Reporte, SeguimientoCaso } from '../../../../shared/models/reporte.model';
import { enlaceLlamada, enlaceWhatsapp, formatearTelefono } from '../../../../shared/utils/telefonos';
import {
  COLOR_INSIGNIA,
  Insignia,
  distanciaKm,
  etiquetaTipo,
  formatearDistancia,
  haceCuanto,
  insigniaDe,
  tieneUbicacion,
} from '../../../../shared/utils/casos';
import { EventoCaso, fechaCorta, lineaDeTiempo, tituloCaso, urlComoLlegar } from '../../detalle-caso';

/**
 * Rediseño: detalle de un caso (/casos/:idCaso).
 *
 * Usa lo que ya expone el backend:
 * - GET /api/reportes/{id} (publico): foto, descripcion, estado, tipo y ubicacion.
 * - GET /api/reportes/{id}/seguimientos: hoy solo responde a la organizacion del
 *   caso; para el resto la linea de tiempo muestra el reporte y la revision.
 * - GET /api/organizaciones/{id}: hoy pide sesion; sin sesion se muestra "Una
 *   organizacion de la red".
 * - "Ofrecer ayuda" abre una conversacion (HU-27) con la organizacion del caso o,
 *   si nadie lo tomo, con quien lo reporto.
 */
@Component({
  selector: 'app-detalle-caso',
  standalone: true,
  imports: [AppHeaderComponent, RouterLink, TranslatePipe],
  templateUrl: './detalle-caso.component.html',
  styleUrl: './detalle-caso.component.css',
  // El punto del mini mapa lo dibuja Leaflet fuera de la plantilla.
  encapsulation: ViewEncapsulation.None,
})
export class DetalleCasoComponent implements OnInit {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly reporteService = inject(ReporteService);
  private readonly organizacionService = inject(OrganizacionService);
  private readonly mensajeService = inject(MensajeService);
  private readonly geo = inject(GeolocalizacionService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly contenedorMapa = viewChild<ElementRef<HTMLDivElement>>('miniMapa');
  private mapa: L.Map | null = null;

  readonly caso = signal<Reporte | null>(null);
  readonly seguimientos = signal<SeguimientoCaso[]>([]);
  readonly organizacion = signal<Organizacion | null>(null);
  readonly miOrganizacion = signal<number | null>(null);
  readonly cargando = signal(true);
  readonly noExiste = signal(false);
  readonly error = signal(false);
  readonly abriendo = signal(false);
  readonly errorAyuda = signal('');
  readonly copiado = signal(false);
  readonly distancia = signal<number | null>(null);
  readonly calculandoDistancia = signal(false);
  // Contacto de quien reporto: se pide recien al tocar "Ver telefono".
  readonly contacto = signal<ContactoReporte | null>(null);
  readonly estadoContacto = signal<'oculto' | 'cargando' | 'listo' | 'sinContacto' | 'error'>('oculto');
  readonly errorDistancia = signal(false);

  readonly haySesion = computed(() => this.auth.usuarioActual() !== null);
  readonly titulo = computed(() => tituloCaso(this.caso()?.descripcion ?? ''));
  readonly eventos = computed(() => {
    const caso = this.caso();
    return caso ? lineaDeTiempo(caso, this.seguimientos()) : [];
  });
  readonly insignia = computed<Insignia>(() => {
    const caso = this.caso();
    return caso ? insigniaDe(caso) : 'activo';
  });
  readonly abierto = computed(() => {
    const estado = this.caso()?.estado;
    return estado === 'PENDIENTE' || estado === 'EN_PROCESO';
  });

  /** Quien reporto, la organizacion del caso o el voluntario que lo reviso. */
  readonly participa = computed(() => {
    const caso = this.caso();
    const yo = this.auth.usuarioActual()?.idUsuario ?? null;
    if (!caso || yo === null) {
      return false;
    }
    return (
      caso.idUsuario === yo ||
      (caso.idRevisor != null && caso.idRevisor === yo) ||
      (caso.idOrganizacion != null && caso.idOrganizacion === this.miOrganizacion())
    );
  });
  /** Se ofrece el contacto si quien reporto lo compartio, el caso sigue abierto y no es tu reporte. */
  readonly ofreceContacto = computed(() => !!this.caso()?.tieneContacto && this.abierto() && !this.esMiReporte());
  readonly esMiReporte = computed(() => this.caso()?.idUsuario === this.auth.usuarioActual()?.idUsuario);

  private idCaso = 0;

  constructor() {
    // El mini mapa se crea cuando el caso ya llego y su contenedor existe.
    effect(() => {
      const contenedor = this.contenedorMapa()?.nativeElement;
      const caso = this.caso();
      if (contenedor && caso && tieneUbicacion(caso) && !this.mapa) {
        this.crearMiniMapa(contenedor, caso.latitud, caso.longitud);
      }
    });
    this.destroyRef.onDestroy(() => {
      this.mapa?.remove();
      this.mapa = null;
    });
  }

  ngOnInit(): void {
    this.ruta.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.idCaso = Number(params.get('idCaso'));
      this.cargar();
    });
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(false);
    this.noExiste.set(false);
    this.mapa?.remove();
    this.mapa = null;
    if (!Number.isInteger(this.idCaso) || this.idCaso <= 0) {
      this.cargando.set(false);
      this.noExiste.set(true);
      return;
    }

    this.reporteService.obtenerPorId(this.idCaso).subscribe({
      next: (caso) => {
        this.caso.set(caso);
        this.cargando.set(false);
        this.cargarComplementos(caso);
      },
      error: (e: HttpErrorResponse) => {
        this.cargando.set(false);
        this.caso.set(null);
        if (e.status === 404) {
          this.noExiste.set(true);
        } else {
          this.error.set(true);
        }
      },
    });
  }

  // ============================================================ presentacion

  etiquetaInsignia(): string {
    return this.translate.t(`casos.insignias.${this.insignia()}`);
  }

  etiquetaTipo(): string {
    return etiquetaTipo(this.caso()?.tipoCaso ?? '', this.t);
  }

  textoEstado(): string {
    const estado = this.caso()?.estado ?? 'PENDIENTE';
    return this.translate.t('detalleCaso.estadoActual', {
      estado: this.translate.t(`detalleCaso.estados.${estado}`),
    });
  }

  textoReportado(): string {
    const caso = this.caso();
    if (!caso) {
      return '';
    }
    const tiempo = haceCuanto(caso.fechaCreacion);
    return this.translate.t('detalleCaso.reportado', { cuando: this.t(tiempo.clave, { n: tiempo.n }) });
  }

  fecha(evento: EventoCaso): string {
    const f = fechaCorta(evento.fecha);
    return this.translate.t(f.clave, { ...f });
  }

  tituloEvento(evento: EventoCaso): string {
    return this.translate.t(`detalleCaso.linea.${evento.tipo}`);
  }

  textoDistancia(): string {
    const km = this.distancia();
    return km === null ? '' : this.translate.t('detalleCaso.ubicacion.aDistancia', { distancia: formatearDistancia(km) });
  }

  comoLlegar(): string {
    const caso = this.caso();
    return caso && tieneUbicacion(caso) ? urlComoLlegar(caso.latitud, caso.longitud) : '';
  }

  tieneUbicacion(): boolean {
    const caso = this.caso();
    return !!caso && tieneUbicacion(caso);
  }

  // ============================================================ acciones

  /** Abre una conversacion con la organizacion del caso o, si no hay, con quien reporto. */
  ofrecerAyuda(): void {
    const caso = this.caso();
    if (!caso || this.abriendo()) {
      return;
    }
    if (!this.haySesion()) {
      void this.router.navigate(['/login']);
      return;
    }
    this.abriendo.set(true);
    this.errorAyuda.set('');
    const destino = caso.idOrganizacion != null ? { idOrganizacion: caso.idOrganizacion } : { idUsuario: caso.idUsuario };
    this.mensajeService.abrirConversacion(destino).subscribe({
      next: (conversacion) => {
        this.abriendo.set(false);
        void this.router.navigate(['/chat', conversacion.idConversacion]);
      },
      error: () => {
        this.abriendo.set(false);
        this.errorAyuda.set(this.translate.t('detalleCaso.ayuda.errorAbrir'));
      },
    });
  }

  contactarOrganizacion(): void {
    const id = this.caso()?.idOrganizacion;
    if (id == null || this.abriendo()) {
      return;
    }
    this.abriendo.set(true);
    this.errorAyuda.set('');
    this.mensajeService.abrirConversacion({ idOrganizacion: id }).subscribe({
      next: (conversacion) => {
        this.abriendo.set(false);
        void this.router.navigate(['/chat', conversacion.idConversacion]);
      },
      error: () => {
        this.abriendo.set(false);
        this.errorAyuda.set(this.translate.t('detalleCaso.ayuda.errorAbrir'));
      },
    });
  }

  async compartir(): Promise<void> {
    const url = typeof location !== 'undefined' ? location.href : '';
    const datos = { title: this.titulo(), url };
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share(datos);
        return;
      }
      await navigator.clipboard.writeText(url);
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2500);
    } catch {
      // La persona cancelo el menu de compartir o el navegador no dio permiso: no pasa nada.
    }
  }

  verContacto(): void {
    const caso = this.caso();
    if (!caso || this.estadoContacto() === 'cargando') {
      return;
    }
    this.estadoContacto.set('cargando');
    this.reporteService.obtenerContacto(caso.idReporte).subscribe({
      next: (contacto) => {
        this.contacto.set(contacto);
        this.estadoContacto.set(contacto && contacto.telefonos.length > 0 ? 'listo' : 'sinContacto');
      },
      error: () => this.estadoContacto.set('error'),
    });
  }

  etiquetaInsigniaContacto(insignia: 'VOLUNTARIO' | 'ORGANIZACION'): string {
    return this.translate.t(`detalleCaso.contacto.insignias.${insignia}`);
  }

  telefonoVisible(numero: string): string {
    return formatearTelefono(numero);
  }

  llamar(numero: string): string {
    return enlaceLlamada(numero);
  }

  whatsapp(numero: string): string {
    return enlaceWhatsapp(numero);
  }

  calcularDistancia(): void {
    const caso = this.caso();
    if (!caso || !tieneUbicacion(caso)) {
      return;
    }
    this.calculandoDistancia.set(true);
    this.errorDistancia.set(false);
    this.geo.obtenerPosicionActual().subscribe({
      next: (posicion) => {
        this.calculandoDistancia.set(false);
        this.distancia.set(distanciaKm(posicion, caso));
      },
      error: () => {
        this.calculandoDistancia.set(false);
        this.errorDistancia.set(true);
      },
    });
  }

  // ============================================================ apoyo

  /** Seguimiento, organizacion y participacion: si alguno falla, la pagina sigue igual. */
  private cargarComplementos(caso: Reporte): void {
    this.seguimientos.set([]);
    this.organizacion.set(null);
    this.contacto.set(null);
    this.estadoContacto.set('oculto');
    if (caso.idOrganizacion != null) {
      this.reporteService
        .obtenerSeguimientos(caso.idReporte)
        .pipe(catchError(() => of([] as SeguimientoCaso[])))
        .subscribe((lista) => this.seguimientos.set(lista));
      if (this.haySesion()) {
        this.organizacionService
          .obtener(caso.idOrganizacion)
          .pipe(catchError(() => of(null)))
          .subscribe((org) => this.organizacion.set(org));
      }
    }
    const yo = this.auth.usuarioActual()?.idUsuario;
    if (yo != null && caso.idOrganizacion != null && caso.idUsuario !== yo) {
      this.organizacionService
        .obtenerDeRepresentante(yo)
        .pipe(catchError(() => of(null)))
        .subscribe((org) => this.miOrganizacion.set(org?.idOrganizacion ?? null));
    }
  }

  private crearMiniMapa(contenedor: HTMLElement, latitud: number, longitud: number): void {
    this.mapa = L.map(contenedor, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
      attributionControl: true,
    }).setView([latitud, longitud], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.mapa);
    const color = COLOR_INSIGNIA[this.insignia()];
    L.marker([latitud, longitud], {
      interactive: false,
      keyboard: false,
      icon: L.divIcon({
        className: 'detalle-punto-icono',
        html: `<span class="detalle-punto" style="background:${color}"></span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    }).addTo(this.mapa);
  }

  private readonly t = (clave: string, params?: Record<string, string | number>) =>
    this.translate.t(clave as TranslationKey, params);
}
