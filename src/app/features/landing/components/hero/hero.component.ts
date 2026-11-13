import {
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { TranslationKey } from '../../../../core/i18n/strings';
import { AuthService } from '../../../../core/services/auth.service';
import { Reporte } from '../../../../shared/models/reporte.model';
import { metaCaso, urgenciaDe } from '../../casos-inicio';

/** Cada cuanto cambia el caso del carrusel. */
export const INTERVALO_CARRUSEL_MS = 5_000;
const UMBRAL_DESLIZAR_PX = 40;

/**
 * Inicio rediseñado: dos "puertas" grandes (reportar / ayudar) y un carrusel con
 * los ultimos casos abiertos.
 *
 * El carrusel cambia cada 5 s, se pausa con el mouse encima o con el foco dentro,
 * se puede deslizar en movil y no avanza solo si el usuario pidio menos movimiento.
 * Todavia no abre el detalle del caso: esa pagina se hace en otro paso.
 */
@Component({
  selector: 'app-landing-hero',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class LandingHero implements OnInit, OnDestroy {
  readonly casos = input<Reporte[]>([]);

  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  readonly indice = signal(0);
  readonly encima = signal(false);
  readonly tactil = signal(false);
  readonly rutaReportar = computed(() => (this.auth.usuarioActual() ? '/reportes/nuevo' : '/login'));

  private temporizador: ReturnType<typeof setInterval> | null = null;
  private inicioToque: number | null = null;

  constructor() {
    // Si cambia la lista (llega del backend), el indice no puede quedar fuera de rango.
    effect(() => {
      const total = this.casos().length;
      if (this.indice() >= total) {
        this.indice.set(0);
      }
    });
  }

  ngOnInit(): void {
    if (!this.esNavegador) {
      return;
    }
    this.tactil.set(this.coincide('(hover: none)'));
    this.iniciarTemporizador();
  }

  ngOnDestroy(): void {
    this.detenerTemporizador();
  }

  urgencia(caso: Reporte): 'urgente' | 'activo' {
    return urgenciaDe(caso);
  }

  etiquetaUrgencia(caso: Reporte): string {
    return this.translate.t(`inicio.insignias.${urgenciaDe(caso)}`);
  }

  meta(caso: Reporte): string {
    return metaCaso(caso, (clave, params) => this.translate.t(clave as TranslationKey, params));
  }

  anterior(): void {
    this.mover(-1);
    this.iniciarTemporizador();
  }

  siguiente(): void {
    this.mover(1);
    this.iniciarTemporizador();
  }

  alEntrar(): void {
    this.encima.set(true);
  }

  alSalir(): void {
    this.encima.set(false);
  }

  /** Solo cuenta como salida si el foco se fue fuera del carrusel. */
  alPerderFoco(evento: FocusEvent): void {
    const carrusel = evento.currentTarget as HTMLElement;
    if (!carrusel.contains(evento.relatedTarget as Node | null)) {
      this.encima.set(false);
    }
  }

  alTocar(evento: TouchEvent): void {
    this.inicioToque = evento.touches[0]?.clientX ?? null;
  }

  alSoltar(evento: TouchEvent): void {
    const fin = evento.changedTouches[0]?.clientX;
    if (this.inicioToque === null || fin === undefined) {
      return;
    }
    const dx = fin - this.inicioToque;
    this.inicioToque = null;
    if (Math.abs(dx) > UMBRAL_DESLIZAR_PX) {
      dx < 0 ? this.siguiente() : this.anterior();
    }
  }

  /** Avance automatico (lo llama el temporizador). */
  avanzar(): void {
    if (!this.encima()) {
      this.mover(1);
    }
  }

  private mover(paso: number): void {
    const total = this.casos().length;
    if (total < 2) {
      return;
    }
    this.indice.update((i) => (((i + paso) % total) + total) % total);
  }

  private iniciarTemporizador(): void {
    this.detenerTemporizador();
    if (!this.esNavegador || this.coincide('(prefers-reduced-motion: reduce)')) {
      return;
    }
    this.temporizador = setInterval(() => this.avanzar(), INTERVALO_CARRUSEL_MS);
  }

  private detenerTemporizador(): void {
    if (this.temporizador !== null) {
      clearInterval(this.temporizador);
      this.temporizador = null;
    }
  }

  private coincide(consulta: string): boolean {
    try {
      return typeof matchMedia === 'function' && matchMedia(consulta).matches;
    } catch {
      return false;
    }
  }
}
