import { describe, expect, it } from 'vitest';

import {
  ORDENES_REPORTE,
  ORDEN_POR_DEFECTO,
  TRANSICIONES_ESTADO,
  estadosSiguientes,
  tieneTransiciones,
} from './gestion-reportes';
import { EstadoReporte } from '../models/reporte.model';

describe('Constantes de gestion de reportes (HU-24)', () => {
  it('debe ofrecer mas recientes y mas antiguos, con mas recientes por defecto', () => {
    expect(ORDENES_REPORTE.map((opcion) => opcion.clave)).toEqual(['RECIENTES', 'ANTIGUOS']);
    expect(ORDEN_POR_DEFECTO).toBe('RECIENTES');
  });

  it('debe llevar la etiqueta de cada orden al catalogo de strings', () => {
    expect(ORDENES_REPORTE.map((opcion) => opcion.etiqueta)).toEqual([
      'admin.orden.recientes',
      'admin.orden.antiguos',
    ]);
  });

  it('no debe dejar resolver un caso que sigue pendiente', () => {
    expect(estadosSiguientes('PENDIENTE')).toEqual(['EN_PROCESO', 'CANCELADO']);
    expect(estadosSiguientes('PENDIENTE')).not.toContain('RESUELTO');
  });

  it('debe resolver un caso solo cuando ya esta en proceso', () => {
    expect(estadosSiguientes('EN_PROCESO')).toContain('RESUELTO');
  });

  it('debe permitir reabrir cualquier caso cerrado', () => {
    expect(estadosSiguientes('RESUELTO')).toContain('PENDIENTE');
    expect(estadosSiguientes('CANCELADO')).toContain('PENDIENTE');
  });

  it('no debe oferecer un estado repetido como destino', () => {
    for (const [estado, destinos] of Object.entries(TRANSICIONES_ESTADO)) {
      expect(destinos).not.toContain(estado);
    }
  });

  it('debe cubrir todos los estados del modelo', () => {
    const estados: EstadoReporte[] = ['PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'CANCELADO'];
    expect(Object.keys(TRANSICIONES_ESTADO).sort()).toEqual([...estados].sort());
  });

  it('debe bloquear el cambio cuando el estado no existe', () => {
    const desconocido = 'PERDIDO' as EstadoReporte;

    expect(estadosSiguientes(desconocido)).toEqual([]);
    expect(tieneTransiciones(desconocido)).toBe(false);
  });

  it('debe permitir el cambio en todos los estados conocidos', () => {
    expect(tieneTransiciones('PENDIENTE')).toBe(true);
    expect(tieneTransiciones('EN_PROCESO')).toBe(true);
    expect(tieneTransiciones('RESUELTO')).toBe(true);
    expect(tieneTransiciones('CANCELADO')).toBe(true);
  });
});