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
}