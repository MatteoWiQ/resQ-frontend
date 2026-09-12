import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';

import { Reporte } from '../../shared/models/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly baseUrl = '/api/reportes';

  constructor(private readonly http: HttpClient) {}

  /**
   * ESQUELETO: este endpoint todavía NO existe en el backend.
   *
   * Cuando se implemente la funcionalidad de "Reportar", agregar en un
   * ReporteController algo así:
   *
   *   @GetMapping("/usuario/{idUsuario}")
   *   public List<ReporteDTO> obtenerPorUsuario(@PathVariable Long idUsuario) {
   *       return reporteRepository.findByIdUsuario(idUsuario)...
   *   }
   *
   * (también hay que agregar el método findByIdUsuario a ReporteRepository)
   *
   * Mientras tanto, esta llamada va a fallar (404) y el catchError
   * devuelve una lista vacía para que la pantalla de "Mi Perfil" no se
   * rompa: simplemente muestra "Todavía no has hecho ningún reporte".
   * En cuanto el endpoint real exista, esto empieza a traer datos solo.
   */
  obtenerMisReportes(idUsuario: number): Observable<Reporte[]> {
    return this.http
      .get<Reporte[]>(`${this.baseUrl}/usuario/${idUsuario}`)
      .pipe(catchError(() => of([])));
  }
}