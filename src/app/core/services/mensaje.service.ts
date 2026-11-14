import { HttpClient, HttpParams } from '@angular/common/http';
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

  /** TT-50: bandeja filtrada por texto y por estado de archivado. */
  obtenerConversaciones(
    filtros: { busqueda?: string; archivadas?: boolean } = {},
  ): Observable<Conversacion[]> {
    let params = new HttpParams();
    if (filtros.busqueda?.trim()) {
      params = params.set('busqueda', filtros.busqueda.trim());
    }
    if (filtros.archivadas !== undefined) {
      params = params.set('archivadas', String(filtros.archivadas));
    }
    return this.http.get<Conversacion[]>(this.baseUrl, { params });
  }

  /** TT-50: archiva o desarchiva una conversación propia. */
  archivarConversacion(idConversacion: number, archivar: boolean): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${idConversacion}/archivar`, null, {
      params: { archivar: String(archivar) },
    });
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
