import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { Notificacion } from '../../shared/models/notificacion.model';

/**
 * HU-19/HU-37: notificaciones in-app del usuario.
 *
 * El servicio guarda la bandeja en un signal para que el contador del header y
 * la bandeja compartan el mismo estado: al marcar leida o archivar, el contador
 * de la navegacion principal cambia de inmediato.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private readonly baseUrl = '/api/notificaciones';

  private readonly _notificaciones = signal<Notificacion[]>([]);
  readonly notificaciones = this._notificaciones.asReadonly();
  readonly noLeidas = computed(
    () => this._notificaciones().filter((n) => !n.leida && !n.archivada).length,
  );

  constructor(private readonly http: HttpClient) {}

  obtenerDeUsuario(idUsuario: number): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${this.baseUrl}/usuario/${idUsuario}`);
  }

  /** Carga la bandeja y la deja disponible para header y bandeja. */
  cargar(idUsuario: number): Observable<Notificacion[]> {
    return this.obtenerDeUsuario(idUsuario).pipe(
      tap((notificaciones) => this._notificaciones.set(notificaciones)),
    );
  }

  marcarComoLeida(idNotificacion: number): Observable<Notificacion> {
    return this.http
      .patch<Notificacion>(`${this.baseUrl}/${idNotificacion}/leida`, {})
      .pipe(tap((actualizada) => this.reemplazar(actualizada)));
  }

  marcarComoNoLeida(idNotificacion: number): Observable<Notificacion> {
    return this.http
      .patch<Notificacion>(`${this.baseUrl}/${idNotificacion}/no-leida`, {})
      .pipe(tap((actualizada) => this.reemplazar(actualizada)));
  }

  archivar(idNotificacion: number): Observable<Notificacion> {
    return this.http
      .patch<Notificacion>(`${this.baseUrl}/${idNotificacion}/archivar`, {})
      .pipe(tap(() => this.quitar(idNotificacion)));
  }

  /** Limpia la bandeja al cerrar sesion para no mostrar avisos de otra cuenta. */
  limpiar(): void {
    this._notificaciones.set([]);
  }

  private reemplazar(actualizada: Notificacion): void {
    this._notificaciones.update((lista) =>
      lista.map((n) => (n.idNotificacion === actualizada.idNotificacion ? actualizada : n)),
    );
  }

  private quitar(idNotificacion: number): void {
    this._notificaciones.update((lista) =>
      lista.filter((n) => n.idNotificacion !== idNotificacion),
    );
  }
}
