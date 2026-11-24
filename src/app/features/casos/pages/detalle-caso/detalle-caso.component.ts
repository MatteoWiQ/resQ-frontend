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
import { Observable, catchError, of } from 'rxjs';
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
import { OrganizacionPublica } from '../../../../shared/models/organizacion.model';
import {
  ContactoReporte,
  NecesidadCaso,
  NovedadCaso,
  Reporte,
  TIPOS_NECESIDAD,
  TipoNecesidad,
} from '../../../../shared/models/reporte.model';
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
 * - GET /api/reportes/{id}/novedades (publico): novedades de la organizacion.
 * - GET /api/reportes/{id}/necesidades (publico): "Que necesita"; con sesion se
 *   puede ofrecer ayuda y quien reporto o la organizacion confirma.
 * - GET /api/organizaciones/publicas/{id} (publico): nombre y logo.
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
  readonly novedades = signal<NovedadCaso[]>([]);
  readonly organizacion = signal<OrganizacionPublica | null>(null);
  // Rediseño: "Que necesita" el caso.
  readonly necesidades = signal<NecesidadCaso[]>([]);
  readonly actualizandoNecesidad = signal(false);
  readonly errorNecesidad = signal('');
  necesidadNueva: TipoNecesidad | '' = '';
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
    return caso ? lineaDeTiempo(caso, this.novedades()) : [];
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
  /** Quien reporto, la organizacion del caso o un admin cambian sus necesidades. */
  readonly gestiona = computed(() => {
    const caso = this.caso();
    if (!caso || !this.haySesion()) {
      return false;
    }
    return (
      this.esMiReporte() ||
      this.auth.esAdmin() ||
      (caso.idOrganizacion != null && caso.idOrganizacion === this.miOrganizacion())
    );
  });
  readonly cubiertas = computed(() => this.necesidades().filter((n) => n.estado === 'CUBIERTA').length);
  readonly tiposParaAgregar = computed(() =>
    TIPOS_NECESIDAD.filter((t) => !this.necesidades().some((n) => n.tipo === t)),
  );
  readonly mostrarNecesidades = computed(() => this.necesidades().length > 0 || (this.gestiona() && this.abierto()));
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

  /** "Perro · adulto · mediano" con lo que se haya cargado del animal. */
  textoAnimal(): string {
    const caso = this.caso();
    if (!caso) {
      return '';
    }
    const partes: string[] = [];
    if (caso.especie) {
      partes.push(this.translate.t(`shared.especies.${caso.especie}`));
    }
    if (caso.edad) {
      partes.push(this.translate.t(`shared.edades.${caso.edad}`).toLowerCase());
    }
    if (caso.tamano) {
      partes.push(this.translate.t(`shared.tamanos.${caso.tamano}`).toLowerCase());
    }
    return partes.join(' · ');
  }

  textoReferencia(): string {
    const referencia = this.caso()?.referencia;
    return referencia ? this.translate.t('detalleCaso.referencia', { texto: referencia }) : '';
  }

  // ============================================================ necesidades

  etiquetaNecesidad(tipo: TipoNecesidad): string {
    return this.translate.t(`shared.necesidades.${tipo}`);
  }

  textoProgreso(): string {
    return this.translate.t('detalleCaso.necesidades.progreso', {
      cubiertas: this.cubiertas(),
      total: this.necesidades().length,
    });
  }

  porcentajeCubierto(): number {
    const total = this.necesidades().length;
    return total === 0 ? 0 : Math.round((this.cubiertas() / total) * 100);
  }

  estadoNecesidad(n: NecesidadCaso): string {
    const nombre = n.nombreAyudante ?? this.translate.t('detalleCaso.necesidades.alguien');
    switch (n.estado) {
      case 'CUBIERTA':
        return this.translate.t('detalleCaso.necesidades.cubierta', { nombre });
      case 'OFRECIDA':
        return this.translate.t('detalleCaso.necesidades.ofrecida', { nombre });
      default:
        return this.translate.t('detalleCaso.necesidades.buscada');
    }
  }

  textoQuitar(n: NecesidadCaso): string {
    return this.translate.t('detalleCaso.necesidades.quitar', { necesidad: this.etiquetaNecesidad(n.tipo) });
  }

  esMiOferta(n: NecesidadCaso): boolean {
    const yo = this.auth.usuarioActual()?.idUsuario;
    return yo != null && n.idAyudante === yo;
  }

  puedeOfrecerse(n: NecesidadCaso): boolean {
    return n.estado === 'BUSCADA' && this.abierto() && !this.esMiReporte();
  }

  accionNecesidad(n: NecesidadCaso, accion: 'ofrecer' | 'confirmar' | 'liberar'): void {
    const caso = this.caso();
    if (!caso) {
      return;
    }
    if (!this.haySesion()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.actualizar(this.reporteService.accionNecesidad(caso.idReporte, n.idNecesidad, accion));
  }

  quitarNecesidad(n: NecesidadCaso): void {
    const caso = this.caso();
    if (caso) {
      this.actualizar(this.reporteService.quitarNecesidad(caso.idReporte, n.idNecesidad));
    }
  }

  agregarNecesidad(): void {
    const caso = this.caso();
    const tipo = this.necesidadNueva;
    if (!caso || !tipo) {
      return;
    }
    this.actualizar(this.reporteService.agregarNecesidad(caso.idReporte, tipo), () => (this.necesidadNueva = ''));
  }

  private actualizar(peticion: Observable<NecesidadCaso[]>, alTerminar?: () => void): void {
    if (this.actualizandoNecesidad()) {
      return;
    }
    this.actualizandoNecesidad.set(true);
    this.errorNecesidad.set('');
    peticion.subscribe({
      next: (lista) => {
        this.necesidades.set(lista);
        this.actualizandoNecesidad.set(false);
        alTerminar?.();
      },
      error: (e: HttpErrorResponse) => {
        this.actualizandoNecesidad.set(false);
        this.errorNecesidad.set(e.error?.message || this.translate.t('detalleCaso.necesidades.error'));
        // Puede que otra persona se haya ofrecido antes: se recarga la lista.
        const caso = this.caso();
        if (caso) {
          this.reporteService
            .obtenerNecesidades(caso.idReporte)
            .pipe(catchError(() => of(this.necesidades())))
            .subscribe((lista) => this.necesidades.set(lista));
        }
      },
    });
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
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
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
    if (!this.haySesion()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
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

  /** Novedades, necesidades, organizacion y participacion: si alguno falla, la pagina sigue igual. */
  private cargarComplementos(caso: Reporte): void {
    this.novedades.set([]);
    this.necesidades.set([]);
    this.organizacion.set(null);
    this.contacto.set(null);
    this.estadoContacto.set('oculto');
    this.errorNecesidad.set('');

    this.reporteService
      .obtenerNovedades(caso.idReporte)
      .pipe(catchError(() => of([] as NovedadCaso[])))
      .subscribe((lista) => this.novedades.set(lista));
    this.reporteService
      .obtenerNecesidades(caso.idReporte)
      .pipe(catchError(() => of([] as NecesidadCaso[])))
      .subscribe((lista) => this.necesidades.set(lista));
    if (caso.idOrganizacion != null) {
      this.organizacionService
        .obtenerPublica(caso.idOrganizacion)
        .pipe(catchError(() => of(null)))
        .subscribe((org) => this.organizacion.set(org));
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
