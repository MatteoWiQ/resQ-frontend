import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChatService } from '../../../../core/services/chat.service';
import { Conversacion } from '../../../../shared/models/conversacion.model';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';

@Component({
  selector: 'app-bandeja-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BackButtonComponent],
  template: `
    <section class="chat-page">
      <app-back-button ruta="/" />

      <div class="chat-container">
        <h1>Mis Conversaciones</h1>
        
        <div class="buscador">
          <input type="text" [(ngModel)]="textoBusqueda" (input)="buscar()" placeholder="Buscar por nombre o mensaje...">
        </div>

        @if (cargando()) {
          <p>Cargando conversaciones...</p>
        } @else if (conversaciones().length === 0) {
          <p>No tienes conversaciones activas.</p>
        } @else {
          <ul class="lista-chats">
            @for (chat of conversaciones(); track chat.idUsuario) {
              <li class="chat-item">
                <div class="avatar">Usuario</div>
                <div class="info" [routerLink]="['/chat', chat.idUsuario]">
                  <h3>{{ chat.nombre }}</h3>
                  <p>{{ chat.ultimoMensaje }}</p>
                </div>
                <div class="acciones">
                  <button (click)="toggleArchivar(chat)">
                    {{ chat.archivada ? 'Desarchivar' : 'Archivar' }}
                  </button>
                </div>
              </li>
            }
          </ul>
        }
      </div>
    </section>
  `,
  styles: [`
    .chat-page { padding: 24px; max-width: 800px; margin: 0 auto; }
    .chat-container { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .buscador input { width: 100%; padding: 10px; margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; }
    .lista-chats { list-style: none; padding: 0; }
    .chat-item { display: flex; align-items: center; gap: 15px; padding: 15px; border-bottom: 1px solid #eee; }
    .avatar { width: 40px; height: 40px; background: #eee; border-radius: 50%; display: grid; place-items: center; font-size: 10px; }
    .info { flex: 1; cursor: pointer; }
    .info h3 { margin: 0; font-size: 16px; }
    .info p { margin: 5px 0 0; font-size: 14px; color: #666; }
    .acciones button { padding: 5px 10px; border: none; border-radius: 5px; cursor: pointer; }
  `]
})
export class BandejaChatComponent implements OnInit {
  private readonly chatService = inject(ChatService);

  conversaciones = signal<Conversacion[]>([]);
  cargando = signal(true);
  textoBusqueda = '';

  ngOnInit(): void {
    this.cargarChats();
  }

  cargarChats(): void {
    this.cargando.set(true);
    this.chatService.obtenerConversaciones(this.textoBusqueda).subscribe({
      next: (data) => {
        this.conversaciones.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  buscar(): void {
    this.cargarChats();
  }

  toggleArchivar(chat: Conversacion): void {
    const nuevoEstado = !chat.archivada;
    this.chatService.archivarConversacion(chat.idUsuario, nuevoEstado).subscribe(() => {
      chat.archivada = nuevoEstado;
    });
  }
}