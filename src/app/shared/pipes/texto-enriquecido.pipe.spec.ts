import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { TextoEnriquecidoPipe } from './texto-enriquecido.pipe';

describe('TextoEnriquecidoPipe (HU-27)', () => {
  const pipe = new TextoEnriquecidoPipe();

  it('convierte **negrita** en strong', () => {
    expect(pipe.transform('Hola **mundo**')).toBe('Hola <strong>mundo</strong>');
  });

  it('convierte *cursiva* en em', () => {
    expect(pipe.transform('Hola *mundo*')).toBe('Hola <em>mundo</em>');
  });

  it('convierte `monoespaciado` en code', () => {
    expect(pipe.transform('Mi id es `abc-123`')).toBe('Mi id es <code>abc-123</code>');
  });

  it('conserva los saltos de linea', () => {
    expect(pipe.transform('linea 1\nlinea 2')).toBe('linea 1<br />linea 2');
  });

  it('escapa el HTML que venga en el mensaje', () => {
    expect(pipe.transform('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
  });

  it('no convierte marcado cuando llega texto vacio', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null)).toBe('');
  });
});
