import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Metricas, Periodo } from '../../shared/models/metricas.model';

/** HU-34: indicadores de la comunidad para el panel de administracion. */
@Injectable({ providedIn: 'root' })
export class MetricasService {
  private readonly baseUrl = '/api/metricas';

  constructor(private readonly http: HttpClient) {}

  /** Para comparar dos periodos se llama una vez por cada uno. */
  obtener(periodo: Periodo): Observable<Metricas> {
    const params = new HttpParams().set('desde', periodo.desde).set('hasta', periodo.hasta);
    return this.http.get<Metricas>(this.baseUrl, { params });
  }
}
