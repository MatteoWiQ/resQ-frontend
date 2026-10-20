import { describe, it, expect } from 'vitest';

import {
  MAX_DIAS_PERIODO,
  aIso,
  desdeIso,
  diasDelPeriodo,
  etiquetaTramo,
  marcasEjeY,
  periodoAnterior,
  periodoPredefinido,
  validarPeriodo,
  variacion,
} from './metricas';

// Un miercoles cualquiera, a media tarde: los atajos no deben depender de la hora.
const HOY = new Date(2026, 9, 21, 17, 45);

describe('constantes de metricas (HU-34)', () => {
  describe('fechas ISO', () => {
    it('convierte a ISO con la fecha local, sin correrse por la zona horaria', () => {
      expect(aIso(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
      expect(aIso(desdeIso('2026-10-01'))).toBe('2026-10-01');
    });

    it('cuenta los dias del periodo incluyendo los dos extremos', () => {
      expect(diasDelPeriodo({ desde: '2026-10-01', hasta: '2026-10-01' })).toBe(1);
      expect(diasDelPeriodo({ desde: '2026-10-01', hasta: '2026-10-31' })).toBe(31);
    });
  });

  describe('periodoPredefinido', () => {
    it('ultimos 7 y 30 dias terminan hoy', () => {
      expect(periodoPredefinido('ULTIMOS_7', HOY)).toEqual({ desde: '2026-10-15', hasta: '2026-10-21' });
      expect(periodoPredefinido('ULTIMOS_30', HOY)).toEqual({ desde: '2026-09-22', hasta: '2026-10-21' });
    });

    it('este mes va del dia 1 a hoy', () => {
      expect(periodoPredefinido('MES_ACTUAL', HOY)).toEqual({ desde: '2026-10-01', hasta: '2026-10-21' });
    });

    it('mes anterior es el mes calendario completo, tambien al cambiar de anio', () => {
      expect(periodoPredefinido('MES_ANTERIOR', HOY)).toEqual({ desde: '2026-09-01', hasta: '2026-09-30' });
      expect(periodoPredefinido('MES_ANTERIOR', new Date(2026, 0, 10))).toEqual({
        desde: '2025-12-01',
        hasta: '2025-12-31',
      });
    });
  });

  describe('periodoAnterior', () => {
    it('devuelve el periodo de igual duracion que termina justo antes', () => {
      expect(periodoAnterior({ desde: '2026-10-01', hasta: '2026-10-07' })).toEqual({
        desde: '2026-09-24',
        hasta: '2026-09-30',
      });
    });
  });

  describe('validarPeriodo', () => {
    it('acepta un periodo correcto', () => {
      expect(validarPeriodo({ desde: '2026-10-01', hasta: '2026-10-31' })).toBeNull();
    });

    it('detecta fechas vacias, invertidas o un periodo demasiado largo', () => {
      expect(validarPeriodo({ desde: '', hasta: '2026-10-31' })).toBe('incompleto');
      expect(validarPeriodo({ desde: '2026-10-31', hasta: '2026-10-01' })).toBe('invertido');

      const desde = desdeIso('2024-01-01');
      const hasta = aIso(new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + MAX_DIAS_PERIODO));
      expect(validarPeriodo({ desde: '2024-01-01', hasta })).toBe('muyLargo');
    });
  });

  describe('variacion', () => {
    it('calcula el porcentaje redondeado respecto de la base', () => {
      expect(variacion(15, 10)).toBe(50);
      expect(variacion(5, 10)).toBe(-50);
      expect(variacion(10, 10)).toBe(0);
    });

    it('sin base (cero) no hay porcentaje', () => {
      expect(variacion(4, 0)).toBeNull();
    });
  });

  describe('presentacion', () => {
    it('etiqueta los tramos por dia o por mes', () => {
      expect(etiquetaTramo('2026-10-05', 'DIA')).toBe('05/10');
      expect(etiquetaTramo('2026-10-05', 'SEMANA')).toBe('05/10');
      expect(etiquetaTramo('2026-10-01', 'MES')).toBe('10/2026');
    });

    it('arma un eje Y de 0 a un maximo redondo que cubre el dato', () => {
      expect(marcasEjeY(37)).toEqual([0, 10, 20, 30, 40]);
      expect(marcasEjeY(7)).toEqual([0, 2, 4, 6, 8]);
      expect(marcasEjeY(0)).toEqual([0, 1, 2, 3, 4]);
    });
  });
});
