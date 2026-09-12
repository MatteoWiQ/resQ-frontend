import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';

import { Reporte } from '../../shared/models/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly baseUrl = '/api/reportes';

  constructor(private readonly http: HttpClient) {}

  /**
   * Reportes de un usuario mediante GET /api/reportes/usuario/{idUsuario},
   * expuesto por ReporteController en el backend.
   */
  obtenerMisReportes(idUsuario: number): Observable<Reporte[]> {
    return this.http
      .get<Reporte[]>(`${this.baseUrl}/usuario/${idUsuario}`)
      .pipe(catchError(() => of([])));
  }
}