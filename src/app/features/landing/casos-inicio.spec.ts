import { describe, expect, it } from 'vitest';

import { casosAbiertos, haceCuanto, metaCaso, urgenciaDe } from './casos-inicio';
import { Reporte } from '../../shared/models/reporte.model';

function reporte(id: number, estado: Reporte['estado'], fechaCreacion: string, tipoCaso = 'PERDIDA'): Reporte {
  return { idReporte: id, idUsuario: 1, tipoCaso, descripcion: '', estado, fotoUrl: null, fechaCreacion };
}

describe('casos-inicio (rediseño del Inicio)', () => {
  it('PENDIENTE es urgente y EN_PROCESO es activo', () => {
    expect(urgenciaDe(reporte(1, 'PENDIENTE', ''))).toBe('urgente');
    expect(urgenciaDe(reporte(1, 'EN_PROCESO', ''))).toBe('activo');
  });

  it('deja solo los abiertos, urgentes primero y del mas reciente al mas antiguo', () => {
    const lista = casosAbiertos([
      reporte(1, 'EN_PROCESO', '2026-11-12T12:00:00'),
      reporte(2, 'RESUELTO', '2026-11-12T13:00:00'),
      reporte(3, 'PENDIENTE', '2026-11-12T08:00:00'),
      reporte(4, 'CANCELADO', '2026-11-12T14:00:00'),
      reporte(5, 'PENDIENTE', '2026-11-12T10:00:00'),
    ]);

    expect(lista.map((r) => r.idReporte)).toEqual([5, 3, 1]);
  });

  it('calcula el tiempo transcurrido en minutos, horas o dias', () => {
    const ahora = new Date('2026-11-12T12:00:00');
    expect(haceCuanto('2026-11-12T11:59:40', ahora)).toEqual({ clave: 'inicio.tiempo.ahora', n: 0 });
    expect(haceCuanto('2026-11-12T11:20:00', ahora)).toEqual({ clave: 'inicio.tiempo.minutos', n: 40 });
    expect(haceCuanto('2026-11-12T09:00:00', ahora)).toEqual({ clave: 'inicio.tiempo.horas', n: 3 });
    expect(haceCuanto('2026-11-09T12:00:00', ahora)).toEqual({ clave: 'inicio.tiempo.dias', n: 3 });
    expect(haceCuanto('no-es-fecha', ahora)).toEqual({ clave: 'inicio.tiempo.ahora', n: 0 });
  });

  it('arma la linea "tipo · hace X" y usa el tipo tal cual si no tiene traduccion', () => {
    const t = (clave: string, p?: Record<string, string | number>) =>
      clave === 'shared.tiposCaso.PERDIDA' ? 'Perdida' : clave === 'inicio.tiempo.horas' ? `hace ${p?.['n']} h` : clave;
    const ahora = new Date('2026-11-12T12:00:00');

    expect(metaCaso(reporte(1, 'PENDIENTE', '2026-11-12T10:00:00'), t, ahora)).toBe('Perdida · hace 2 h');
    expect(metaCaso(reporte(1, 'PENDIENTE', '2026-11-12T10:00:00', 'OTRO'), t, ahora)).toBe('OTRO · hace 2 h');
  });
});
