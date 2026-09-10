import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { LoginRequest } from '../../../../shared/models/auth.models';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
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
      error: (error: HttpErrorResponse) => this.message.set(`Error al conectar: ${error.message}`),
    });
  }
}