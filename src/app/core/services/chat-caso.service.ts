import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, filter, map } from 'rxjs';

import { MensajeCaso, ParticipanteChat } from '../../shared/models/mensaje-caso.model';
import { DatosChatEscribiendo, DatosUsuarioEnLinea } from '../../shared/models/evento-websocket.model';
import { WebSocketService } from './websocket.service';

/**
 * HU-22: chat en vivo de un caso entre el reportante, la organizacion asignada y el
 * voluntario que lo reviso.
 *
 * Los mensajes se envian por REST (el backend valida y guarda) y llegan a todos por la
 * sala STOMP del caso como chat.message, incluido a quien lo envio. Por eso la pagina
 * deduplica por idMensaje.
 */
@Injectable({ providedIn: 'root' })
export class ChatCasoService {
  private readonly http = inject(HttpClient);
  private readonly ws = inject(WebSocketService);

  private url(idCaso: number): string {
    return `/api/casos/${idCaso}/chat`;
  }

  historial(idCaso: number): Observable<MensajeCaso[]> {
    return this.http.get<MensajeCaso[]>(`${this.url(idCaso)}/mensajes`);
  }

  participantes(idCaso: number): Observable<ParticipanteChat[]> {
    return this.http.get<ParticipanteChat[]>(`${this.url(idCaso)}/participantes`);
  }

  enviarTexto(idCaso: number, contenido: string): Observable<MensajeCaso> {
    return this.http.post<MensajeCaso>(`${this.url(idCaso)}/mensajes`, { contenido });
  }

  enviarUbicacion(idCaso: number, latitud: number, longitud: number, comentario?: string): Observable<MensajeCaso> {
    return this.http.post<MensajeCaso>(`${this.url(idCaso)}/mensajes`, {
      contenido: comentario?.trim() || null,
      latitud,
      longitud,
    });
  }

  enviarFoto(idCaso: number, foto: File, comentario?: string): Observable<MensajeCaso> {
    const datos = new FormData();
    datos.append('foto', foto);
    if (comentario?.trim()) {
      datos.append('comentario', comentario.trim());
    }
    return this.http.post<MensajeCaso>(`${this.url(idCaso)}/fotos`, datos);
  }

  /** Se une a la sala del caso; devuelve la funcion para salir. */
  entrar(idCaso: number): () => void {
    return this.ws.suscribirCaso(idCaso);
  }

  /** Mensajes nuevos del caso en tiempo real. */
  mensajes(idCaso: number): Observable<MensajeCaso> {
    return this.ws.enEvento('chat.message').pipe(
      map((evento) => evento.datos),
      filter((m) => m.idCaso === idCaso),
    );
  }

  escribiendo(idCaso: number): Observable<DatosChatEscribiendo> {
    return this.ws.enEvento('chat.typing').pipe(
      map((evento) => evento.datos),
      filter((d) => d.idCaso === idCaso),
    );
  }

  presencia(): Observable<DatosUsuarioEnLinea> {
    return this.ws.enEvento('user.online').pipe(map((evento) => evento.datos));
  }

  avisarEscribiendo(idCaso: number): void {
    this.ws.avisarEscribiendo(idCaso);
  }
}
