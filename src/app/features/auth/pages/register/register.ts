import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, BackButtonComponent, TranslatePipe],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

  usuario = {
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    rol: ''
  };

  message = signal('');

  constructor(private authService: AuthService, private translate: TranslateService) {}

  onRegister() {
    this.message.set('');
    this.authService.register(this.usuario).subscribe({
      next: () => {
        this.message.set(this.translate.t('auth.register.ok'));
      },
      error: (error: { status?: number }) => {
        this.message.set(this.traducirError(error?.status));
      }
    });
  }

  /**
   * El backend responde distinto segun el motivo: 409 si el correo ya existe,
   * 400 si algun campo no pasa la validacion y 403 si se intenta crear un ADMIN
   * por el alta publica. Cualquier otro caso o una caida se trata como error de
   * conexion, para no mostrar un mensaje de "datos invalidos" que confunda.
   */
  private traducirError(estado?: number): string {
    switch (estado) {
      case 409:
        return this.translate.t('auth.register.errorEmailRegistrado');
      case 400:
        return this.translate.t('auth.register.errorDatosInvalidos');
      default:
        return this.translate.t('auth.register.errorDb');
    }
  }
}