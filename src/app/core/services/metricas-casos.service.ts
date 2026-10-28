import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { MetricasCasos, Periodo } from '../../shared/models/metricas.model';

/** HU-33: indicadores de casos y reportes para el panel de administracion. */
@Injectable({ providedIn: 'root' })
export class MetricasCasosService {
  private readonly baseUrl = '/api/metricas/casos';

  constructor(private readonly http: HttpClient) {}

  /** Igual que en HU-34, para comparar dos periodos se llama una vez por cada uno. */
  obtener(periodo: Periodo): Observable<MetricasCasos> {
    const params = new HttpParams().set('desde', periodo.desde).set('hasta', periodo.hasta);
    return this.http.get<MetricasCasos>(this.baseUrl, { params });
  }
}
