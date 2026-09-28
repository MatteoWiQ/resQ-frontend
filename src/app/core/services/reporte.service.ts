import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';

import { EstadoReporte, Reporte } from '../../shared/models/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly baseUrl = '/api/reportes';

  constructor(private readonly http: HttpClient) {}

  obtenerTodos(estados?: EstadoReporte | EstadoReporte[] | null): Observable<Reporte[]> {
    return this.http.get<Reporte[]>(this.baseUrl, {
      params: ReporteService.construirParams(estados),
    });
  }

  /**
   * El backend espera una lista separada por comas, por ejemplo
   * `?estado=PENDIENTE,EN_PROCESO`. Sin estados no se manda el parametro,
   * para que el backend devuelva todos los casos.
   */
  private static construirParams(estados?: EstadoReporte | EstadoReporte[] | null): HttpParams {
    const lista = estados == null ? [] : Array.isArray(estados) ? estados : [estados];
    const validos = [...new Set(lista)].filter(Boolean);

    return validos.length > 0
      ? new HttpParams().set('estado', validos.join(','))
      : new HttpParams();
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
    latitud?: number | null;
    longitud?: number | null;
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
    latitud?: number | null;
    longitud?: number | null;
  }): Observable<Reporte> {
    return this.http.put<Reporte>(`${this.baseUrl}/${id}`, datos);
  }
}