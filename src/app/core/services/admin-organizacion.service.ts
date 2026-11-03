import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  FiltroEstadoOrganizacion,
  OrganizacionAdmin,
  RevisionOrganizacion,
} from '../../shared/models/organizacion-admin.model';

/**
 * HU-25: el administrador consulta, aprueba y rechaza organizaciones.
 * HU-32: con nota (motivo obligatorio al rechazar), historial y documento de verificación.
 */
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

  /** La nota es opcional al aprobar. */
  aprobar(idOrganizacion: number, nota?: string): Observable<OrganizacionAdmin> {
    const cuerpo = nota?.trim() ? { nota: nota.trim() } : {};
    return this.http.put<OrganizacionAdmin>(`${this.baseUrl}/${idOrganizacion}/aprobar`, cuerpo);
  }

  /** HU-32: el motivo es obligatorio (el backend responde 400 si falta). */
  rechazar(idOrganizacion: number, motivo: string): Observable<OrganizacionAdmin> {
    return this.http.put<OrganizacionAdmin>(`${this.baseUrl}/${idOrganizacion}/rechazar`, {
      nota: motivo.trim(),
    });
  }

  /** HU-32: historial de verificación, lo más reciente primero. */
  historial(idOrganizacion: number): Observable<RevisionOrganizacion[]> {
    return this.http.get<RevisionOrganizacion[]>(`${this.baseUrl}/${idOrganizacion}/revisiones`);
  }

  /**
   * HU-32: el documento es privado, así que se pide con el token (como Blob) en vez de
   * enlazarlo directamente: un <a href> no enviaría el header Authorization.
   */
  documento(idOrganizacion: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${idOrganizacion}/documento`, { responseType: 'blob' });
  }
}
