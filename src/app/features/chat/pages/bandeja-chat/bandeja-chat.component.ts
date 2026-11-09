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
import { Conversacion } from '../../../../shared/models/mensaje.model';
import { Organizacion } from '../../../../shared/models/organizacion.model';

/**
 * HU-39/HU-27: bandeja de conversaciones entre usuarios.
 *
 * Lista las conversaciones del usuario y permite abrir una nueva con una
 * organizacion verificada del directorio.
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
  readonly cargando = signal(true);
  readonly cargandoOrganizaciones = signal(false);
  readonly error = signal('');
  readonly mostrarNueva = signal(false);
  readonly busquedaOrganizacion = signal('');

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

  /** Abre el selector de organizaciones y trae el directorio. */
  abrirNueva(): void {
    this.mostrarNueva.set(true);
    if (this.organizaciones().length === 0) {
      this.cargarOrganizaciones();
    }
  }

  cargarOrganizaciones(): void {
    this.cargandoOrganizaciones.set(true);
    this.suscripciones.add(
      this.organizacionService.listarDirectorio(this.busquedaOrganizacion() || undefined).subscribe({
        next: (organizaciones) => {
          this.organizaciones.set(organizaciones);
          this.cargandoOrganizaciones.set(false);
        },
        error: () => this.cargandoOrganizaciones.set(false),
      }),
    );
  }

  iniciarConOrganizacion(idOrganizacion: number): void {
    this.suscripciones.add(
      this.mensajeService.abrirConversacion({ idOrganizacion }).subscribe({
        next: (conversacion) => {
          this.mostrarNueva.set(false);
          void this.router.navigate(['/chat', conversacion.idConversacion]);
        },
        error: () => this.error.set(this.translate.t('mensajes.errorAbrir')),
      }),
    );
  }
}
