import { describe, expect, it } from 'vitest';

import { aplicarFiltros, dentroDeZona, ordenar } from './casos-filtros';
import { Reporte } from '../../shared/models/reporte.model';
import { distanciaKm, formatearDistancia, insigniaDe } from '../../shared/utils/casos';

function caso(id: number, extra: Partial<Reporte> = {}): Reporte {
  return {
    idReporte: id,
    idUsuario: 1,
    tipoCaso: 'PERDIDA',
    descripcion: `Caso ${id}`,
    estado: 'PENDIENTE',
    fotoUrl: null,
    fechaCreacion: '2026-11-12T10:00:00',
    latitud: -17.39,
    longitud: -66.15,
    ...extra,
  };
}

const SIN_FILTROS = { tipo: null, distanciaMaxKm: null, posicion: null, zona: null };

describe('Casos: filtros y orden (rediseño)', () => {
  it('filtra por tipo de caso aunque venga en minusculas', () => {
    const lista = [caso(1), caso(2, { tipoCaso: 'encontrada' }), caso(3, { tipoCaso: 'ABANDONADA' })];

    expect(aplicarFiltros(lista, { ...SIN_FILTROS, tipo: 'ENCONTRADA' }).map((c) => c.idReporte)).toEqual([2]);
  });

  it('filtra por distancia y deja fuera los casos sin ubicacion', () => {
    const aqui = { latitud: -17.39, longitud: -66.15 };
    const lista = [
      caso(1),
      caso(2, { latitud: -17.45, longitud: -66.15 }), // ~6,7 km
      caso(3, { latitud: null, longitud: null }),
    ];

    expect(aplicarFiltros(lista, { ...SIN_FILTROS, distanciaMaxKm: 5, posicion: aqui }).map((c) => c.idReporte)).toEqual([1]);
    expect(aplicarFiltros(lista, { ...SIN_FILTROS, distanciaMaxKm: 10, posicion: aqui }).map((c) => c.idReporte)).toEqual([1, 2]);
  });

  it('"Buscar en esta zona" deja solo los casos dentro del rectangulo del mapa', () => {
    const zona = { sur: -17.4, oeste: -66.2, norte: -17.3, este: -66.1 };

    expect(dentroDeZona(caso(1), zona)).toBe(true);
    expect(dentroDeZona(caso(2, { latitud: -17.5 }), zona)).toBe(false);
    expect(dentroDeZona(caso(3, { latitud: null }), zona)).toBe(false);
  });

  it('ordena por urgencia (pendiente, en proceso, resuelto) y luego por fecha', () => {
    const lista = [
      caso(1, { estado: 'RESUELTO', fechaCreacion: '2026-11-12T12:00:00' }),
      caso(2, { estado: 'EN_PROCESO', fechaCreacion: '2026-11-12T11:00:00' }),
      caso(3, { estado: 'PENDIENTE', fechaCreacion: '2026-11-12T08:00:00' }),
      caso(4, { estado: 'PENDIENTE', fechaCreacion: '2026-11-12T09:00:00' }),
    ];

    expect(ordenar(lista, 'URGENTES', null).map((c) => c.idReporte)).toEqual([4, 3, 2, 1]);
    expect(ordenar(lista, 'RECIENTES', null).map((c) => c.idReporte)).toEqual([1, 2, 4, 3]);
  });

  it('ordena por cercania cuando hay ubicacion', () => {
    const aqui = { latitud: -17.39, longitud: -66.15 };
    const lista = [caso(1, { latitud: -17.45 }), caso(2), caso(3, { latitud: null, longitud: null })];

    expect(ordenar(lista, 'CERCANOS', aqui).map((c) => c.idReporte)).toEqual([2, 1, 3]);
  });

  it('calcula y muestra distancias', () => {
    const km = distanciaKm({ latitud: -17.39, longitud: -66.15 }, { latitud: -17.4, longitud: -66.15 });
    expect(km).toBeCloseTo(1.11, 1);
    expect(formatearDistancia(0.43)).toBe('430 m');
    expect(formatearDistancia(1.234)).toBe('1,2 km');
    expect(formatearDistancia(12.6)).toBe('13 km');
  });

  it('cada estado tiene su insignia', () => {
    expect(insigniaDe(caso(1, { estado: 'PENDIENTE' }))).toBe('urgente');
    expect(insigniaDe(caso(1, { estado: 'EN_PROCESO' }))).toBe('activo');
    expect(insigniaDe(caso(1, { estado: 'RESUELTO' }))).toBe('resuelto');
    expect(insigniaDe(caso(1, { estado: 'CANCELADO' }))).toBe('cancelado');
  });
});
