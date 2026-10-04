import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';

import { EstadoReporte, Reporte } from '../../shared/models/reporte.model';
import { OrdenReporte } from '../../shared/constants/gestion-reportes';

export interface ConsultaReportes {
  busqueda?: string;
  orden?: OrdenReporte | null;
}

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly baseUrl = '/api/reportes';

  constructor(private readonly http: HttpClient) {}

  obtenerTodos(
    estados?: EstadoReporte | EstadoReporte[] | null,
    consulta?: ConsultaReportes,
  ): Observable<Reporte[]> {
    return this.http.get<Reporte[]>(this.baseUrl, {
      params: ReporteService.construirParams(estados, consulta),
    });
  }

  /**
   * El backend espera una lista separada por comas, por ejemplo
   * `?estado=PENDIENTE,EN_PROCESO`. Sin estados no se manda el parametro,
   * para que el backend devuelva todos los casos.
   *
   * HU-24: `busqueda` y `orden` tambien son opcionales y viajan solo si vienen, de
   * modo que un consumidor que no los necesite sigue hablando igual que antes.
   */
  private static construirParams(
    estados?: EstadoReporte | EstadoReporte[] | null,
    consulta?: ConsultaReportes,
  ): HttpParams {
    const lista = estados == null ? [] : Array.isArray(estados) ? estados : [estados];
    const validos = [...new Set(lista)].filter(Boolean);

    let params = validos.length > 0 ? new HttpParams().set('estado', validos.join(',')) : new HttpParams();

    const busqueda = consulta?.busqueda?.trim();
    if (busqueda) {
      params = params.set('busqueda', busqueda);
    }

    if (consulta?.orden) {
      params = params.set('orden', consulta.orden);
    }

    return params;
  }

  /** HU-24: el detalle de un caso, para abrirlo desde el panel sin recargar la tabla. */
  obtenerPorId(id: number): Observable<Reporte> {
    return this.http.get<Reporte>(`${this.baseUrl}/${id}`);
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

  /**
   * HU-24: cambia solo el estado. El backend valida que el salto sea uno de los
   * permitidos y responde 409 cuando no lo es.
   */
  cambiarEstado(id: number, estado: EstadoReporte): Observable<Reporte> {
    return this.http.patch<Reporte>(`${this.baseUrl}/${id}/estado`, { estado });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}