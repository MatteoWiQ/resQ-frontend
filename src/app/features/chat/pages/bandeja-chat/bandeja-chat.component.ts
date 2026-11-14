import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { MensajeService } from '../../../../core/services/mensaje.service';
import { OrganizacionService } from '../../../../core/services/organizacion.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { AppHeaderComponent } from '../../../../shared/components/app-header/app-header.component';
import { Conversacion, DirectorioUsuario } from '../../../../shared/models/mensaje.model';
import { Organizacion } from '../../../../shared/models/organizacion.model';

/**
 * HU-39/HU-27: bandeja de conversaciones entre usuarios.
 *
 * Lista las conversaciones del usuario y permite abrir una nueva con una
 * organizacion verificada o con otro usuario.
 */
@Component({
  selector: 'app-bandeja-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe, AppHeaderComponent, BackButtonComponent],
  templateUrl: './bandeja-chat.component.html',
  styleUrl: './bandeja-chat.component.css',
})
export class BandejaChatComponent implements OnInit {
  private readonly mensajeService = inject(MensajeService);
  private readonly organizacionService = inject(OrganizacionService);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  readonly conversaciones = signal<Conversacion[]>([]);
  readonly organizaciones = signal<Organizacion[]>([]);
  readonly usuarios = signal<DirectorioUsuario[]>([]);
  readonly cargando = signal(true);
  readonly cargandoOrganizaciones = signal(false);
  readonly cargandoUsuarios = signal(false);
  readonly error = signal('');
  readonly errorBusqueda = signal('');
  readonly mostrarNueva = signal(false);
  readonly busqueda = signal('');

  private readonly suscripciones = new Subscription();

  ngOnInit(): void {
    if (this.authService.obtenerIdUsuarioActual() === null) {
      this.error.set(this.translate.t('mensajes.sinSesion'));
      this.cargando.set(false);
      return;
    }
    this.cargarConversaciones();
  }

  cargarConversaciones(): void {
    this.cargando.set(true);
    this.suscripciones.add(
      this.mensajeService.obtenerConversaciones().subscribe({
        next: (conversaciones) => {
          this.conversaciones.set(conversaciones);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set(this.translate.t('mensajes.errorCargar'));
          this.cargando.set(false);
        },
      }),
    );
  }

  /** Abre el selector y trae el directorio completo de organizaciones. */
  abrirNueva(): void {
    this.mostrarNueva.set(true);
    if (this.organizaciones().length === 0) {
      this.cargarOrganizaciones();
    }
  }

  /** TT-49: busca organizaciones y usuarios con el mismo texto. */
  buscar(): void {
    this.errorBusqueda.set('');
    this.cargarOrganizaciones();
    this.cargarUsuarios();
  }

  cargarOrganizaciones(): void {
    this.cargandoOrganizaciones.set(true);
    this.suscripciones.add(
      this.organizacionService
        .listarDirectorio({ nombre: this.busqueda() || undefined })
        .subscribe({
          next: (organizaciones) => {
            this.organizaciones.set(organizaciones);
            this.cargandoOrganizaciones.set(false);
          },
          error: () => {
            this.organizaciones.set([]);
            this.cargandoOrganizaciones.set(false);
            this.errorBusqueda.set(this.translate.t('mensajes.errorBuscar'));
          },
        }),
    );
  }

  cargarUsuarios(): void {
    const texto = this.busqueda().trim();
    if (texto.length < 2) {
      this.usuarios.set([]);
      return;
    }
    this.cargandoUsuarios.set(true);
    this.suscripciones.add(
      this.mensajeService.buscarUsuarios(texto).subscribe({
        next: (usuarios) => {
          this.usuarios.set(usuarios);
          this.cargandoUsuarios.set(false);
        },
        error: () => {
          this.usuarios.set([]);
          this.cargandoUsuarios.set(false);
          this.errorBusqueda.set(this.translate.t('mensajes.errorBuscar'));
        },
      }),
    );
  }

  iniciarConOrganizacion(idOrganizacion: number): void {
    this.abrir({ idOrganizacion });
  }

  iniciarConUsuario(idUsuario: number): void {
    this.abrir({ idUsuario });
  }

  private abrir(destino: { idUsuario?: number; idOrganizacion?: number }): void {
    this.suscripciones.add(
      this.mensajeService.abrirConversacion(destino).subscribe({
        next: (conversacion) => {
          this.mostrarNueva.set(false);
          void this.router.navigate(['/chat', conversacion.idConversacion]);
        },
        error: () => this.error.set(this.translate.t('mensajes.errorAbrir')),
      }),
    );
  }
}
