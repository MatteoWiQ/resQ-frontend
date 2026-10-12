import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';

import {
  FormularioOrganizacion,
  Organizacion,
  OrganizacionRegistrada,
} from '../../shared/models/organizacion.model';

/**
 * HU-20 / HU-28: registro, consulta y edición de organizaciones.
 */
@Injectable({ providedIn: 'root' })
export class OrganizacionService {
  private readonly baseUrl = '/api/organizaciones';

  constructor(private readonly http: HttpClient) {}

  /** Envía el formulario y el logo (opcional) en una sola petición multipart. */
  registrar(
    idRepresentante: number,
    form: FormularioOrganizacion,
    logo: File | null,
  ): Observable<OrganizacionRegistrada> {
    const datos = new FormData();
    datos.append('idRepresentante', String(idRepresentante));
    datos.append('nombre', form.nombre.trim());
    datos.append('tipo', form.tipo);
    datos.append('direccion', form.direccion.trim());
    datos.append('telefono', form.telefono.trim());
    datos.append('email', form.email.trim());
    if (form.descripcion.trim()) {
      datos.append('descripcion', form.descripcion.trim());
    }
    if (logo) {
      datos.append('logo', logo);
    }
    return this.http.post<OrganizacionRegistrada>(this.baseUrl, datos);
  }

  /** HU-28: envía los cambios. Si `quitarLogo` es true, elimina el logo existente
   * (se ignora cuando se adjunta un `logo` nuevo). */
  actualizar(
    idOrganizacion: number,
    idRepresentante: number,
    form: FormularioOrganizacion,
    logo: File | null,
    quitarLogo: boolean,
  ): Observable<Organizacion> {
    const datos = new FormData();
    datos.append('idRepresentante', String(idRepresentante));
    datos.append('nombre', form.nombre.trim());
    datos.append('tipo', form.tipo);
    datos.append('direccion', form.direccion.trim());
    datos.append('telefono', form.telefono.trim());
    datos.append('email', form.email.trim());
    if (form.descripcion.trim()) {
      datos.append('descripcion', form.descripcion.trim());
    }
    datos.append('horarios', form.horarios.trim());
    datos.append('zonasCobertura', form.zonasCobertura.trim());
    if (logo) {
      datos.append('logo', logo);
    }
    if (quitarLogo) {
      datos.append('quitarLogo', 'true');
    }
    return this.http.put<Organizacion>(`${this.baseUrl}/${idOrganizacion}`, datos);
  }

  /** Organización que representa el usuario, o null si todavía no registró ninguna. */
  obtenerDeRepresentante(idUsuario: number): Observable<Organizacion | null> {
    return this.http.get<Organizacion>(`${this.baseUrl}/representante/${idUsuario}`).pipe(
      catchError((err: HttpErrorResponse) => (err.status === 404 ? of(null) : throwError(() => err))),
    );
  }
}
