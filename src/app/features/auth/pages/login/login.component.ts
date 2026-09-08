import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../../core/services/auth.service';
import { LoginRequest } from '../../../../shared/models/auth.models';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  readonly credentials: LoginRequest = { username: '', password: '' };

  readonly message = signal('');

  private readonly authService = inject(AuthService);

  onLogin(): void {
    this.authService.login(this.credentials).subscribe({
      next: (response) => this.message.set(`Login exitoso: ${JSON.stringify(response)}`),
      error: (error: HttpErrorResponse) => {
        // Mensaje genérico para el usuario (como pidieron tus compañeros)
        if (error.status === 404) {
          this.message.set('No se encontró el servicio. Contacta al administrador.');
        } else if (error.status === 0) {
          this.message.set('No se pudo conectar al servidor. Inténtalo más tarde.');
        } else {
          this.message.set('No se pudo conectar a la base de datos. Verifica tu conexión.');
        }
      },
    });
  }
}