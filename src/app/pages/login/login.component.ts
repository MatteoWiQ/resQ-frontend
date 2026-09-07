import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div style="text-align:center; margin-top:50px;">
      <h2>Login de Prueba</h2>
      <form (ngSubmit)="onLogin()">
        <input type="text" [(ngModel)]="username" name="username" placeholder="Usuario" required>
        <br><br>
        <input type="password" [(ngModel)]="password" name="password" placeholder="Contraseña" required>
        <br><br>
        <button type="submit">Iniciar Sesión</button>
      </form>

      <!-- Usamos @if en lugar de *ngIf para que no dé error en Angular 22 -->
      @if (message) {
        <p style="color: blue;">{{ message }}</p>
      }
    </div>
  `,
  styles: []
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  message: string = '';

  constructor(private http: HttpClient) {}

  onLogin() {
    const body = { username: this.username, password: this.password };
    
    this.http.post('/api/login', body).subscribe({
      next: (response) => {
        this.message = '✅ Login exitoso: ' + JSON.stringify(response);
      },
      error: (err) => {
        this.message = '❌ Error al conectar: ' + err.message;
      }
    });
  }
}