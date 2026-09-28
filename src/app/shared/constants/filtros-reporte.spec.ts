import {
  FILTROS_REPORTE,
  FILTRO_TODOS,
  claveFiltroPorEstados,
  filtroPorClave,
} from './filtros-reporte';

describe('Filtros de reporte (HU-15)', () => {
  it('debe exponer los cinco filtros en orden, empezando por todos', () => {
    expect(FILTROS_REPORTE.map((filtro) => filtro.clave)).toEqual([
      'TODOS',
      'URGENTES',
      'ACTIVOS',
      'RESUELTOS',
      'CANCELADOS',
    ]);
  });

  it('debe dejar el filtro TODOS sin estados para no enviar parametros', () => {
    expect(FILTRO_TODOS.estados).toEqual([]);
    expect(filtroPorClave('TODOS').estados).toEqual([]);
  });

  it('debe resolver cada grupo a los estados que espera el backend', () => {
    expect(filtroPorClave('URGENTES').estados).toEqual(['PENDIENTE']);
    expect(filtroPorClave('ACTIVOS').estados).toEqual(['PENDIENTE', 'EN_PROCESO']);
    expect(filtroPorClave('RESUELTOS').estados).toEqual(['RESUELTO']);
    expect(filtroPorClave('CANCELADOS').estados).toEqual(['CANCELADO']);
  });

  it('debe caer en TODOS cuando la clave no existe', () => {
    expect(filtroPorClave('INVENTADO' as never).clave).toBe('TODOS');
  });

  it('debe reconocer el filtro que corresponde a un conjunto de estados', () => {
    expect(claveFiltroPorEstados(['PENDIENTE'])).toBe('URGENTES');
    expect(claveFiltroPorEstados(['PENDIENTE', 'EN_PROCESO'])).toBe('ACTIVOS');
    expect(claveFiltroPorEstados(['RESUELTO'])).toBe('RESUELTOS');
    expect(claveFiltroPorEstados(['CANCELADO'])).toBe('CANCELADOS');
  });

  it('debe reconocer el filtro sin importar el orden ni los repetidos', () => {
    expect(claveFiltroPorEstados(['EN_PROCESO', 'PENDIENTE'])).toBe('ACTIVOS');
    expect(claveFiltroPorEstados(['PENDIENTE', 'EN_PROCESO', 'PENDIENTE'])).toBe('ACTIVOS');
  });

  it('debe tratar ausencia de estados como el filtro TODOS', () => {
    expect(claveFiltroPorEstados(null)).toBe('TODOS');
    expect(claveFiltroPorEstados(undefined)).toBe('TODOS');
    expect(claveFiltroPorEstados([])).toBe('TODOS');
  });

  it('debe caer en TODOS cuando la combinacion no corresponde a ningun grupo', () => {
    expect(claveFiltroPorEstados(['PENDIENTE', 'CANCELADO'])).toBe('TODOS');
  });
});
