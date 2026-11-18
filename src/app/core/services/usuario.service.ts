import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Usuario } from '../../shared/models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly baseUrl = '/api/usuarios';

  constructor(private readonly http: HttpClient) {}

  obtenerTodos(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.baseUrl);
  }

  obtenerPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.baseUrl}/${id}`);
  }

  actualizar(id: number, datos: {
    nombre: string;
    email: string;
    password?: string;
    telefono: string;
    rol: string;
  }): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/${id}`, datos);
  }

  // HU-23: eliminar una cuenta desde el panel de administracion.
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // HU-17: solicitar convertirse en voluntario (primera vez)
  registrarComoVoluntario(id: number, tiposAyuda: string[]): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.baseUrl}/${id}/voluntario`, { tiposAyuda });
  }

  // HU-17: editar qué tipos de ayuda ofrece un voluntario existente
  actualizarTiposAyuda(id: number, tiposAyuda: string[]): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.baseUrl}/${id}/voluntario/tipos-ayuda`, { tiposAyuda });
  }
}