import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Conversacion } from '../../shared/models/conversacion.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly baseUrl = '/api/chat';

  constructor(private readonly http: HttpClient) {}

  obtenerConversaciones(busqueda?: string): Observable<Conversacion[]> {
    let params = new HttpParams();
    if (busqueda) {
      params = params.set('busqueda', busqueda);
    }
    return this.http.get<Conversacion[]>(`${this.baseUrl}/conversaciones`, { params });
  }

  archivarConversacion(idUsuario: number, archivar: boolean): Observable<void> {
    return this.http.patch<void>(
      `${this.baseUrl}/conversaciones/${idUsuario}/archivar?archivar=${archivar}`, 
      {}
    );
  }
}