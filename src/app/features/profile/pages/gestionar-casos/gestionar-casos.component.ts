import { SlicePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { TranslationKey } from '../../../../core/i18n/strings';
import { AuthService } from '../../../../core/services/auth.service';
import { OrganizacionService } from '../../../../core/services/organizacion.service';
import { ReporteService } from '../../../../core/services/reporte.service';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { FOTO_ACCEPT, validarFoto } from '../../../../shared/constants/foto';
import { estadosSiguientes } from '../../../../shared/constants/gestion-reportes';
import { Organizacion } from '../../../../shared/models/organizacion.model';
import { EstadoReporte, Reporte, SeguimientoCaso } from '../../../../shared/models/reporte.model';

type Vista = 'mis-casos' | 'disponibles';

/**
 * HU-21: panel de una organización verificada para ver y gestionar los casos que
 * está atendiendo (cambiar estado, agregar seguimiento con nota + foto) y para
 * ver y tomar casos todavía sin asignar.
 */
@Component({
  selector: 'app-gestionar-casos',
  standalone: true,
  imports: [FormsModule, RouterLink, BackButtonComponent, TranslatePipe, SlicePipe],
  templateUrl: './gestionar-casos.component.html',
  styleUrl: './gestionar-casos.component.css',
})
export class GestionarCasosComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly organizacionService = inject(OrganizacionService);
  private readonly reporteService = inject(ReporteService);
  private readonly translate = inject(TranslateService);

  readonly logoAccept = FOTO_ACCEPT;
  readonly estadosPosibles: EstadoReporte[] = ['PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'CANCELADO'];

  readonly hayUsuario = signal(false);
  readonly cargando = signal(true);
  readonly organizacion = signal<Organizacion | null>(null);
  readonly mensaje = signal('');

  readonly vista = signal<Vista>('mis-casos');

  readonly casos = signal<Reporte[]>([]);
  readonly cargandoCasos = signal(false);
  readonly filtroEstado = signal<EstadoReporte | ''>('');
  readonly filtroDesde = signal('');
  readonly filtroHasta = signal('');

  readonly disponibles = signal<Reporte[]>([]);
  readonly cargandoDisponibles = signal(false);
  readonly disponiblesCargados = signal(false);
  readonly aceptando = signal<number | null>(null);

  readonly casosFiltrados = computed(() => {
    const desde = this.filtroDesde();
    const hasta = this.filtroHasta();
    if (!desde && !hasta) {
      return this.casos();
    }
    return this.casos().filter((caso) => {
      const fecha = caso.fechaCreacion.slice(0, 10);
      if (desde && fecha < desde) return false;
      if (hasta && fecha > hasta) return false;
      return true;
    });
  });

  // ============ Cambio de estado ============
  readonly estadoSeleccionado = signal<Record<number, string>>({});
  readonly guardandoEstado = signal<number | null>(null);

  // ============ Seguimiento ============
  readonly casoExpandido = signal<number | null>(null);
  readonly seguimientos = signal<SeguimientoCaso[]>([]);
  readonly cargandoSeguimientos = signal(false);
  readonly notaNueva = signal('');
  readonly fotoSeguimiento = signal<File | null>(null);
  readonly vistaPreviaSeguimiento = signal<string | null>(null);
  readonly erroresSeguimiento = signal<Record<string, string>>({});
  readonly enviandoSeguimiento = signal(false);

  ngOnInit(): void {
    const idUsuario = this.authService.obtenerIdUsuarioActual();
    this.hayUsuario.set(idUsuario !== null);
    if (idUsuario === null) {
      this.cargando.set(false);
      return;
    }

    this.organizacionService.obtenerDeRepresentante(idUsuario).subscribe({
      next: (organizacion) => {
        this.organizacion.set(organizacion);
        this.cargando.set(false);
        if (organizacion?.puedeGestionarCasos) {
          this.cargarCasos();
        }
      },
      error: () => {
        this.mensaje.set(this.translate.t('gestionCasos.errorCargar'));
        this.cargando.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.liberarVistaPreviaSeguimiento();
  }

  etiquetaEstado(estado: string): string {
    return this.translate.t(('shared.estados.' + estado) as TranslationKey);
  }

  // ============ Vistas ============
  mostrarMisCasos(): void {
    this.vista.set('mis-casos');
  }

  mostrarDisponibles(): void {
    this.vista.set('disponibles');
    if (!this.disponiblesCargados()) {
      this.cargarDisponibles();
    }
  }

  // ============ Mis casos ============
  cambiarFiltroEstado(estado: string): void {
    this.filtroEstado.set(estado as EstadoReporte | '');
    this.cargarCasos();
  }

  cargarCasos(): void {
    const org = this.organizacion();
    if (!org) {
      return;
    }
    this.cargandoCasos.set(true);
    const estado = this.filtroEstado();
    this.reporteService.obtenerCasosOrganizacion(org.idOrganizacion, estado ? estado : null).subscribe({
      next: (casos) => {
        this.casos.set(casos);
        this.cargandoCasos.set(false);
      },
      error: () => {
        this.mensaje.set(this.translate.t('gestionCasos.errorCargar'));
        this.cargandoCasos.set(false);
      },
    });
  }

  opcionesEstado(caso: Reporte): EstadoReporte[] {
    return estadosSiguientes(caso.estado);
  }

  seleccionarEstado(idReporte: number, estado: string): void {
    this.estadoSeleccionado.update((actual) => ({ ...actual, [idReporte]: estado }));
  }

  guardarEstado(caso: Reporte): void {
    const nuevo = this.estadoSeleccionado()[caso.idReporte];
    if (!nuevo || this.guardandoEstado() !== null) {
      return;
    }
    this.guardandoEstado.set(caso.idReporte);
    this.reporteService.cambiarEstado(caso.idReporte, nuevo as EstadoReporte).subscribe({
      next: (actualizado) => {
        this.guardandoEstado.set(null);
        this.casos.update((lista) =>
          lista.map((c) => (c.idReporte === actualizado.idReporte ? actualizado : c)),
        );
        this.estadoSeleccionado.update((actual) => {
          const { [caso.idReporte]: _quitado, ...resto } = actual;
          return resto;
        });
        this.mensaje.set(this.translate.t('gestionCasos.cambiarEstado.ok'));
      },
      error: () => {
        this.guardandoEstado.set(null);
        this.mensaje.set(this.translate.t('gestionCasos.cambiarEstado.error'));
      },
    });
  }

  // ============ Casos disponibles ============
  cargarDisponibles(): void {
    this.cargandoDisponibles.set(true);
    this.reporteService.obtenerDisponibles().subscribe({
      next: (casos) => {
        this.disponibles.set(casos);
        this.disponiblesCargados.set(true);
        this.cargandoDisponibles.set(false);
      },
      error: () => {
        this.mensaje.set(this.translate.t('gestionCasos.errorCargar'));
        this.cargandoDisponibles.set(false);
      },
    });
  }

  aceptar(id: number): void {
    if (this.aceptando() !== null) {
      return;
    }
    this.aceptando.set(id);
    this.reporteService.aceptarCaso(id).subscribe({
      next: () => {
        this.aceptando.set(null);
        this.disponibles.update((lista) => lista.filter((c) => c.idReporte !== id));
        this.mensaje.set(this.translate.t('gestionCasos.aceptar.ok'));
        this.cargarCasos();
      },
      error: (err: HttpErrorResponse) => {
        this.aceptando.set(null);
        this.mensaje.set(
          this.translate.t(err.status === 409 ? 'gestionCasos.aceptar.yaAceptado' : 'gestionCasos.aceptar.error'),
        );
        this.cargarDisponibles();
      },
    });
  }

  // ============ Seguimiento ============
  toggleSeguimiento(caso: Reporte): void {
    if (this.casoExpandido() === caso.idReporte) {
      this.casoExpandido.set(null);
      return;
    }
    this.casoExpandido.set(caso.idReporte);
    this.notaNueva.set('');
    this.quitarFotoSeguimiento();
    this.erroresSeguimiento.set({});
    this.cargarSeguimientos(caso.idReporte);
  }

  private cargarSeguimientos(idReporte: number): void {
    this.cargandoSeguimientos.set(true);
    this.reporteService.obtenerSeguimientos(idReporte).subscribe({
      next: (lista) => {
        this.seguimientos.set(lista);
        this.cargandoSeguimientos.set(false);
      },
      error: () => {
        this.cargandoSeguimientos.set(false);
      },
    });
  }

  seleccionarFotoSeguimiento(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) {
      return;
    }

    const error = validarFoto(archivo);
    if (error) {
      this.erroresSeguimiento.update((actuales) => ({
        ...actuales,
        foto: this.translate.t(
          error === 'FORMATO' ? 'gestionCasos.seguimiento.fotoErrorFormato' : 'gestionCasos.seguimiento.fotoErrorTamano',
        ),
      }));
      return;
    }

    this.liberarVistaPreviaSeguimiento();
    this.erroresSeguimiento.update((actuales) => {
      const { foto: _quitado, ...resto } = actuales;
      return resto;
    });
    this.fotoSeguimiento.set(archivo);
    this.vistaPreviaSeguimiento.set(URL.createObjectURL(archivo));
  }

  quitarFotoSeguimiento(): void {
    this.liberarVistaPreviaSeguimiento();
    this.fotoSeguimiento.set(null);
  }

  private liberarVistaPreviaSeguimiento(): void {
    const url = this.vistaPreviaSeguimiento();
    if (url) {
      URL.revokeObjectURL(url);
    }
    this.vistaPreviaSeguimiento.set(null);
  }

  textoBotonFoto(): string {
    return this.translate.t(
      this.fotoSeguimiento() ? 'gestionCasos.seguimiento.fotoCambiar' : 'gestionCasos.seguimiento.fotoSeleccionar',
    );
  }

  enviarSeguimiento(idReporte: number): void {
    if (this.enviandoSeguimiento()) {
      return;
    }
    const nota = this.notaNueva().trim();
    if (!nota) {
      this.erroresSeguimiento.set({ nota: this.translate.t('gestionCasos.seguimiento.errorNotaObligatoria') });
      return;
    }
    this.erroresSeguimiento.set({});
    this.enviandoSeguimiento.set(true);

    const foto = this.fotoSeguimiento();
    const continuar = (fotoUrl: string | null): void => {
      this.reporteService.agregarSeguimiento(idReporte, { nota, fotoUrl }).subscribe({
        next: (nuevo) => {
          this.enviandoSeguimiento.set(false);
          this.seguimientos.update((lista) => [nuevo, ...lista]);
          this.notaNueva.set('');
          this.quitarFotoSeguimiento();
        },
        error: () => {
          this.enviandoSeguimiento.set(false);
          this.erroresSeguimiento.set({ general: this.translate.t('gestionCasos.seguimiento.errorGenerico') });
        },
      });
    };

    if (foto) {
      this.reporteService.subirFoto(foto).subscribe({
        next: (respuesta) => continuar(respuesta.fotoUrl),
        error: () => {
          this.enviandoSeguimiento.set(false);
          this.erroresSeguimiento.set({ foto: this.translate.t('gestionCasos.seguimiento.fotoErrorSubir') });
        },
      });
    } else {
      continuar(null);
    }
  }
}