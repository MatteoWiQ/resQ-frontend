import { describe, expect, it } from 'vitest';

import { fechaCorta, lineaDeTiempo, tituloCaso, urlComoLlegar } from './detalle-caso';
import { Reporte, SeguimientoCaso } from '../../shared/models/reporte.model';

const REPORTE: Reporte = {
  idReporte: 7,
  idUsuario: 2,
  tipoCaso: 'ABANDONADA',
  descripcion: 'Perro herido en la plaza. No apoya la pata trasera.',
  estado: 'EN_PROCESO',
  fotoUrl: null,
  fechaCreacion: '2026-11-12T09:12:00',
};

function seguimiento(id: number, fecha: string, nota: string): SeguimientoCaso {
  return { idSeguimiento: id, idReporte: 7, idOrganizacion: 3, nota, fotoUrl: null, fechaCreacion: fecha };
}

describe('detalle del caso: reglas (rediseño)', () => {
  it('el titulo es la primera frase de la descripcion, acortada si es larga', () => {
    expect(tituloCaso(REPORTE.descripcion)).toBe('Perro herido en la plaza');
    expect(tituloCaso('x'.repeat(120), 20)).toBe('x'.repeat(19) + '…');
    expect(tituloCaso('  Gata   con crías  ')).toBe('Gata con crías');
  });

  it('la linea de tiempo junta reporte, revision aprobada y novedades, lo mas nuevo arriba', () => {
    const eventos = lineaDeTiempo(
      { ...REPORTE, estadoRevision: 'APROBADO', fechaRevision: '2026-11-12T09:20:00' },
      [seguimiento(1, '2026-11-12T11:05:00', 'Lo llevamos al veterinario')],
    );

    expect(eventos.map((e) => e.tipo)).toEqual(['seguimiento', 'revisado', 'reportado']);
    expect(eventos[0].nota).toBe('Lo llevamos al veterinario');
  });

  it('una revision pendiente o rechazada no aparece en la linea de tiempo', () => {
    expect(lineaDeTiempo({ ...REPORTE, estadoRevision: 'RECHAZADO', fechaRevision: '2026-11-12T09:20:00' }, []).length).toBe(1);
    expect(lineaDeTiempo({ ...REPORTE, estadoRevision: 'APROBADO', fechaRevision: null }, []).length).toBe(1);
  });

  it('las fechas se muestran como Hoy, Ayer o dd/mm con la hora', () => {
    const ahora = new Date('2026-11-13T15:00:00');
    expect(fechaCorta('2026-11-13T09:48:00', ahora)).toEqual({ clave: 'detalleCaso.fecha.hoy', hora: '9:48' });
    expect(fechaCorta('2026-11-12T21:05:00', ahora)).toEqual({ clave: 'detalleCaso.fecha.ayer', hora: '21:05' });
    expect(fechaCorta('2026-11-02T08:00:00', ahora)).toEqual({ clave: 'detalleCaso.fecha.otro', hora: '8:00', dia: '02/11' });
  });

  it('"Como llegar" abre las indicaciones hasta el punto del caso', () => {
    expect(urlComoLlegar(-17.39, -66.15)).toBe('https://www.google.com/maps/dir/?api=1&destination=-17.39,-66.15');
  });
});
