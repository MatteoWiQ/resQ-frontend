import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  Conversacion,
  DestinatarioConversacion,
  DirectorioUsuario,
  Mensaje,
} from '../../shared/models/mensaje.model';

/**
 * HU-27: mensajes entre usuarios (un usuario con otro usuario o con una organizacion).
 *
 * El envio es multipart para poder llevar texto y adjunto en la misma peticion;
 * si no hay adjunto se manda el archivo vacio para que el backend lo ignore.
 */
@Injectable({ providedIn: 'root' })
export class MensajeService {
  private readonly baseUrl = '/api/conversaciones';

  constructor(private readonly http: HttpClient) {}

  obtenerConversaciones(): Observable<Conversacion[]> {
    return this.http.get<Conversacion[]>(this.baseUrl);
  }

  abrirConversacion(destino: DestinatarioConversacion): Observable<Conversacion> {
    return this.http.post<Conversacion>(this.baseUrl, destino);
  }

  /** TT-49: usuarios con los que se puede iniciar una conversacion. */
  buscarUsuarios(nombre: string): Observable<DirectorioUsuario[]> {
    return this.http.get<DirectorioUsuario[]>(`${this.baseUrl}/directorio`, {
      params: { nombre },
    });
  }

  obtenerMensajes(idConversacion: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.baseUrl}/${idConversacion}/mensajes`);
  }

  enviarMensaje(idConversacion: number, contenido: string, archivo?: File | null): Observable<Mensaje> {
    const datos = new FormData();
    datos.append('contenido', contenido);
    if (archivo) {
      datos.append('archivo', archivo, archivo.name);
    }
    return this.http.post<Mensaje>(`${this.baseUrl}/${idConversacion}/mensajes`, datos);
  }

  eliminarMensaje(idMensaje: number): Observable<void> {
    return this.http.delete<void>(`/api/mensajes/${idMensaje}`);
  }
}
