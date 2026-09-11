import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { LoginRequest } from '../../../../shared/models/auth.models';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, BackButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  readonly credentials: LoginRequest = { username: '', password: '' };

  readonly message = signal('');

  private readonly authService = inject(AuthService);

  onLogin(): void {
    this.message.set('');
    this.authService.login(this.credentials).subscribe({
      next: (response) => this.message.set(`Login exitoso: ${JSON.stringify(response)}`),
      error: () => this.message.set('No se pudo conectar con la base de datos. Inténtalo de nuevo más tarde.'),
    });
  }
}