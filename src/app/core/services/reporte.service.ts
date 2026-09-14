import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';

import { Reporte } from '../../shared/models/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly baseUrl = '/api/reportes';

  constructor(private readonly http: HttpClient) {}

  obtenerTodos(): Observable<Reporte[]> {
    return this.http.get<Reporte[]>(this.baseUrl);
  }

  obtenerMisReportes(idUsuario: number): Observable<Reporte[]> {
    return this.http
      .get<Reporte[]>(`${this.baseUrl}/usuario/${idUsuario}`)
      .pipe(catchError(() => of([])));
  }

  crearReporte(reporte: {
    idUsuario: number;
    tipoCaso: string;
    descripcion: string;
    fotoUrl: string | null;
  }): Observable<Reporte> {
    return this.http.post<Reporte>(this.baseUrl, {
      ...reporte,
      estado: 'PENDIENTE',
    });
  }

  actualizar(id: number, datos: {
    idUsuario: number;
    tipoCaso: string;
    descripcion: string;
    estado: string;
    fotoUrl: string | null;
  }): Observable<Reporte> {
    return this.http.put<Reporte>(`${this.baseUrl}/${id}`, datos);
  }
}