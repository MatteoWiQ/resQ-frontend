import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface SolicitudVoluntarioResumen {
  idSolicitud: number;
  idUsuario: number;
  nombreUsuario: string;
  emailUsuario: string;
  telefonoUsuario: string | null;
  tipoAyuda: string | null;
  mensaje: string | null;
  estado: string;
  fechaSolicitud: string;
}

export interface SolicitudVoluntarioDetalle extends SolicitudVoluntarioResumen {
  fechaResolucion: string | null;
  motivoRechazo: string | null;
  revisadoPorId: number | null;
  revisadoPorNombre: string | null;
  notificada: boolean;
}

/**
 * HU-35: revisión de solicitudes de voluntarios por el administrador.
 */
@Injectable({ providedIn: 'root' })
export class SolicitudVoluntarioService {
  private readonly baseUrl = '/api/solicitudes-voluntarios';

  constructor(private readonly http: HttpClient) {}

  listarPendientes(): Observable<SolicitudVoluntarioResumen[]> {
    return this.http.get<SolicitudVoluntarioResumen[]>(`${this.baseUrl}/pendientes`);
  }

  obtenerDetalle(id: number): Observable<SolicitudVoluntarioDetalle> {
    return this.http.get<SolicitudVoluntarioDetalle>(`${this.baseUrl}/${id}`);
  }

  aprobar(id: number): Observable<SolicitudVoluntarioDetalle> {
    return this.http.put<SolicitudVoluntarioDetalle>(`${this.baseUrl}/${id}/aprobar`, {});
  }

  rechazar(id: number, motivo: string): Observable<SolicitudVoluntarioDetalle> {
    return this.http.put<SolicitudVoluntarioDetalle>(`${this.baseUrl}/${id}/rechazar`, { motivo });
  }
}
