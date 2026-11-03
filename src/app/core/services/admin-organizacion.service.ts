import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  FiltroEstadoOrganizacion,
  OrganizacionAdmin,
} from '../../shared/models/organizacion-admin.model';

/** HU-25: el administrador consulta, aprueba y rechaza organizaciones. */
@Injectable({ providedIn: 'root' })
export class AdminOrganizacionService {
  private readonly baseUrl = '/api/admin/organizaciones';

  constructor(private readonly http: HttpClient) {}

  /** Las más recientes primero. Con 'TODAS' no se envía filtro. */
  listar(filtro: FiltroEstadoOrganizacion): Observable<OrganizacionAdmin[]> {
    const params = filtro === 'TODAS' ? new HttpParams() : new HttpParams().set('estado', filtro);
    return this.http.get<OrganizacionAdmin[]>(this.baseUrl, { params });
  }

  detalle(idOrganizacion: number): Observable<OrganizacionAdmin> {
    return this.http.get<OrganizacionAdmin>(`${this.baseUrl}/${idOrganizacion}`);
  }

  aprobar(idOrganizacion: number): Observable<OrganizacionAdmin> {
    return this.http.put<OrganizacionAdmin>(`${this.baseUrl}/${idOrganizacion}/aprobar`, {});
  }

  rechazar(idOrganizacion: number): Observable<OrganizacionAdmin> {
    return this.http.put<OrganizacionAdmin>(`${this.baseUrl}/${idOrganizacion}/rechazar`, {});
  }
}
