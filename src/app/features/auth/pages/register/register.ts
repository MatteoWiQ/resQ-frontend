import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, BackButtonComponent],
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

  constructor(private authService: AuthService) {}

  onRegister() {
    this.message.set('');
    this.authService.register(this.usuario).subscribe({
      next: () => {
        this.message.set('Usuario registrado correctamente');
      },
      error: () => {
        this.message.set('No se pudo conectar con la base de datos. Inténtalo de nuevo más tarde.');
      }
    });
  }
}