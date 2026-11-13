import { Reporte, SeguimientoCaso } from '../../shared/models/reporte.model';

/**
 * Rediseño: reglas del detalle de un caso que no dependen de la pantalla.
 */

/** El reporte no tiene titulo: se usa la primera frase de la descripcion, acortada. */
export function tituloCaso(descripcion: string, max = 80): string {
  const texto = (descripcion ?? '').trim().replace(/\s+/g, ' ');
  const frase = texto.split(/(?<=[.!?])\s/)[0] ?? texto;
  const sinPunto = frase.replace(/[.]$/, '');
  return sinPunto.length <= max ? sinPunto : `${sinPunto.slice(0, max - 1).trimEnd()}…`;
}

export type TipoEvento = 'reportado' | 'revisado' | 'seguimiento';

export interface EventoCaso {
  tipo: TipoEvento;
  fecha: string;
  nota: string | null;
  fotoUrl: string | null;
}

/**
 * Linea de tiempo del caso, de lo mas reciente a lo mas antiguo. Solo entra lo que
 * tiene fecha: el reporte, la revision aprobada y las novedades de la organizacion.
 */
export function lineaDeTiempo(reporte: Reporte, seguimientos: SeguimientoCaso[]): EventoCaso[] {
  const eventos: EventoCaso[] = [{ tipo: 'reportado', fecha: reporte.fechaCreacion, nota: null, fotoUrl: null }];
  if (reporte.estadoRevision === 'APROBADO' && reporte.fechaRevision) {
    eventos.push({ tipo: 'revisado', fecha: reporte.fechaRevision, nota: null, fotoUrl: null });
  }
  for (const s of seguimientos) {
    eventos.push({ tipo: 'seguimiento', fecha: s.fechaCreacion, nota: s.nota, fotoUrl: s.fotoUrl });
  }
  return eventos.sort((a, b) => tiempo(b.fecha) - tiempo(a.fecha));
}

export type FechaCorta =
  | { clave: 'detalleCaso.fecha.hoy' | 'detalleCaso.fecha.ayer'; hora: string }
  | { clave: 'detalleCaso.fecha.otro'; hora: string; dia: string };

/** "Hoy, 9:48", "Ayer, 9:48" o "12/11, 9:48". */
export function fechaCorta(fechaIso: string, ahora: Date = new Date()): FechaCorta {
  const fecha = new Date(fechaIso);
  const hora = `${fecha.getHours()}:${String(fecha.getMinutes()).padStart(2, '0')}`;
  const dias = Math.round((inicioDelDia(ahora) - inicioDelDia(fecha)) / 86_400_000);
  if (dias === 0) {
    return { clave: 'detalleCaso.fecha.hoy', hora };
  }
  if (dias === 1) {
    return { clave: 'detalleCaso.fecha.ayer', hora };
  }
  const dia = `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}`;
  return { clave: 'detalleCaso.fecha.otro', hora, dia };
}

/** Enlace de "Como llegar" (abre la app de mapas del telefono o Google Maps). */
export function urlComoLlegar(latitud: number, longitud: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitud},${longitud}`;
}

function inicioDelDia(fecha: Date): number {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime();
}

function tiempo(fechaIso: string): number {
  const t = new Date(fechaIso).getTime();
  return Number.isFinite(t) ? t : 0;
}
