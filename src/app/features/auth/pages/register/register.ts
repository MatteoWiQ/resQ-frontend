import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
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

  constructor(private authService: AuthService) {}

  onRegister() {
    this.authService.register(this.usuario).subscribe({
      next: (response) => {
        console.log('Usuario registrado correctamente:', response);
        alert('Usuario registrado correctamente');
      },
      error: (error) => {
        console.error('Error al registrar usuario:', error);
        alert('Error al registrar usuario');
      }
    });
  }
}