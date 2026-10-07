import { describe, expect, it } from 'vitest';

import { TIPOS_CASO, esTipoCaso, normalizarTipoCaso } from './tipos-caso';

describe('normalizarTipoCaso', () => {
  it('devuelve el tipo canonico para valores del catalogo', () => {
    for (const tipo of TIPOS_CASO) {
      expect(normalizarTipoCaso(tipo)).toBe(tipo);
    }
  });

  it('normaliza minusculas, mayusculas mezcladas y espacios', () => {
    expect(normalizarTipoCaso('perdida')).toBe('PERDIDA');
    expect(normalizarTipoCaso(' Encontrada ')).toBe('ENCONTRADA');
    expect(normalizarTipoCaso('ABANDONADA')).toBe('ABANDONADA');
  });

  it('devuelve el valor original cuando no esta en el catalogo', () => {
    expect(normalizarTipoCaso('EXTRANJERO')).toBe('EXTRANJERO');
    expect(normalizarTipoCaso('tipo raro')).toBe('tipo raro');
  });

  it('devuelve cadena vacia para null/undefined/vacio', () => {
    expect(normalizarTipoCaso(null)).toBe('');
    expect(normalizarTipoCaso(undefined)).toBe('');
    expect(normalizarTipoCaso('   ')).toBe('');
  });
});

describe('esTipoCaso', () => {
  it('reconoce los tipos del catalogo aunque vengan con formato distinto', () => {
    expect(esTipoCaso('PERDIDA')).toBe(true);
    expect(esTipoCaso(' perdida ')).toBe(true);
  });

  it('rechaza valores desconocidos o vacios', () => {
    expect(esTipoCaso('EXTRANJERO')).toBe(false);
    expect(esTipoCaso('')).toBe(false);
    expect(esTipoCaso(null)).toBe(false);
  });
});
