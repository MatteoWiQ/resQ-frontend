import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import {
  ContactoReporte,
  EdadAnimal,
  Especie,
  EstadoReporte,
  NecesidadCaso,
  NovedadCaso,
  Reporte,
  SeguimientoCaso,
  TamanoAnimal,
  TipoNecesidad,
} from '../../shared/models/reporte.model';
import { OrdenReporte } from '../../shared/constants/gestion-reportes';

export interface ConsultaReportes {
  busqueda?: string;
  orden?: OrdenReporte | null;
  /** Rediseño: casos que todavia buscan este tipo de ayuda (filtro "Necesita"). */
  necesidad?: TipoNecesidad | null;
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

    if (consulta?.necesidad) {
      params = params.set('necesidad', consulta.necesidad);
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

  /** HU-10: sube la fotografía y devuelve la fotoUrl con la que se crea el reporte. */
  subirFoto(archivo: File): Observable<{ fotoUrl: string }> {
    const datos = new FormData();
    datos.append('foto', archivo);
    return this.http.post<{ fotoUrl: string }>(`${this.baseUrl}/fotos`, datos);
  }

  crearReporte(reporte: {
    idUsuario: number;
    tipoCaso: string;
    descripcion: string;
    fotoUrl: string | null;
    latitud?: number | null;
    longitud?: number | null;
    // Contacto opcional: mostrar el telefono de la cuenta y/u otro solo para este caso.
    compartirTelefonoCuenta?: boolean;
    telefonoContacto?: string | null;
    // Rediseño: referencia del lugar, datos del animal y necesidades iniciales.
    referencia?: string | null;
    especie?: Especie | null;
    edad?: EdadAnimal | null;
    tamano?: TamanoAnimal | null;
    necesidades?: TipoNecesidad[];
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

  // ============ HU-21: gestión de casos por una organización ============

  /** Casos que ninguna organización ha tomado todavía. */
  obtenerDisponibles(): Observable<Reporte[]> {
    return this.http.get<Reporte[]>(`${this.baseUrl}/disponibles`);
  }

  /** Panel de "mis casos" de una organización, opcionalmente filtrado por estado. */
  obtenerCasosOrganizacion(
    idOrganizacion: number,
    estados?: EstadoReporte | EstadoReporte[] | null,
    orden?: OrdenReporte | null,
  ): Observable<Reporte[]> {
    const lista = estados == null ? [] : Array.isArray(estados) ? estados : [estados];
    const validos = [...new Set(lista)].filter(Boolean);

    let params = validos.length > 0 ? new HttpParams().set('estados', validos.join(',')) : new HttpParams();
    if (orden) {
      params = params.set('orden', orden);
    }

    return this.http.get<Reporte[]>(`${this.baseUrl}/organizacion/${idOrganizacion}`, { params });
  }

  /** Una organización verificada toma un caso disponible. */
  aceptarCaso(id: number): Observable<Reporte> {
    return this.http.patch<Reporte>(`${this.baseUrl}/${id}/aceptar`, {});
  }

  /** Historial de seguimiento de un caso, más reciente primero. */
  /** Rediseño: novedades publicas del caso (fecha, nota y foto). */
  obtenerNovedades(id: number): Observable<NovedadCaso[]> {
    return this.http.get<NovedadCaso[]>(`${this.baseUrl}/${id}/novedades`);
  }

  // ---- Rediseño: necesidades del caso. Cada accion devuelve la lista actualizada.

  obtenerNecesidades(id: number): Observable<NecesidadCaso[]> {
    return this.http.get<NecesidadCaso[]>(`${this.baseUrl}/${id}/necesidades`);
  }

  agregarNecesidad(id: number, tipo: TipoNecesidad): Observable<NecesidadCaso[]> {
    return this.http.post<NecesidadCaso[]>(`${this.baseUrl}/${id}/necesidades`, { tipo });
  }

  quitarNecesidad(id: number, idNecesidad: number): Observable<NecesidadCaso[]> {
    return this.http.delete<NecesidadCaso[]>(`${this.baseUrl}/${id}/necesidades/${idNecesidad}`);
  }

  accionNecesidad(id: number, idNecesidad: number, accion: 'ofrecer' | 'confirmar' | 'liberar'): Observable<NecesidadCaso[]> {
    return this.http.post<NecesidadCaso[]>(`${this.baseUrl}/${id}/necesidades/${idNecesidad}/${accion}`, {});
  }

  /** Contacto de quien reporto (exige sesion). null si no lo compartio o el caso esta cerrado (204). */
  obtenerContacto(id: number): Observable<ContactoReporte | null> {
    return this.http.get<ContactoReporte | null>(`${this.baseUrl}/${id}/contacto`).pipe(map((c) => c ?? null));
  }

  obtenerSeguimientos(id: number): Observable<SeguimientoCaso[]> {
    return this.http.get<SeguimientoCaso[]>(`${this.baseUrl}/${id}/seguimientos`);
  }

  /** Agrega una entrada de seguimiento (nota + foto opcional) a un caso. */
  agregarSeguimiento(
    id: number,
    datos: { nota: string; fotoUrl: string | null },
  ): Observable<SeguimientoCaso> {
    return this.http.post<SeguimientoCaso>(`${this.baseUrl}/${id}/seguimientos`, datos);
  }
}