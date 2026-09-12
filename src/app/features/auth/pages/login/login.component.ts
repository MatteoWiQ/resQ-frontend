import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
<<<<<<< Updated upstream
import { RouterLink } from '@angular/router';
=======
import { Router } from '@angular/router';
>>>>>>> Stashed changes

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
  readonly credentials: LoginRequest = { email: '', password: '' };

  readonly message = signal('');

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  onLogin(): void {
    this.message.set('');
    this.authService.login(this.credentials).subscribe({
<<<<<<< Updated upstream
      next: (response) => this.message.set(`Login exitoso: ${JSON.stringify(response)}`),
      error: () => this.message.set('No se pudo conectar con la base de datos. Inténtalo de nuevo más tarde.'),
=======
      next: () => this.router.navigate(['/']),
      error: (error: HttpErrorResponse) => this.message.set(`Error al conectar: ${error.message}`),
>>>>>>> Stashed changes
    });
  }
}