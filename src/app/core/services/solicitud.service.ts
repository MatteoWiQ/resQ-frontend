import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Reporte } from '../../shared/models/reporte.model';

export type DecisionSolicitud = 'APROBAR' | 'RECHAZAR';

/** HU-19: revisión de solicitudes (casos reportados) por voluntarios. */
@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private readonly baseUrl = '/api/reportes/revision';

  constructor(private readonly http: HttpClient) {}

  obtenerPendientes(idRevisor: number): Observable<Reporte[]> {
    return this.http.get<Reporte[]>(`${this.baseUrl}/pendientes`, {
      params: new HttpParams().set('idRevisor', idRevisor),
    });
  }

  decidir(
    idReporte: number,
    datos: { idRevisor: number; decision: DecisionSolicitud; nota: string },
  ): Observable<Reporte> {
    return this.http.post<Reporte>(`${this.baseUrl}/${idReporte}/decision`, datos);
  }
}
