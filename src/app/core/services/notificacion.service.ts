import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Notificacion } from '../../shared/models/notificacion.model';

/** HU-19: notificaciones in-app del usuario. */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private readonly baseUrl = '/api/notificaciones';

  constructor(private readonly http: HttpClient) {}

  obtenerDeUsuario(idUsuario: number): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${this.baseUrl}/usuario/${idUsuario}`);
  }

  marcarComoLeida(idNotificacion: number): Observable<Notificacion> {
    return this.http.patch<Notificacion>(`${this.baseUrl}/${idNotificacion}/leida`, {});
  }
}
