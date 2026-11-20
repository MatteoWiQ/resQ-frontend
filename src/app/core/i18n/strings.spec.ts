
import { describe, expect, it } from 'vitest';
import { es, en } from './strings';

type Catalogo = Record<string, unknown>;

function obtenerClaves(
  objeto: Catalogo,
  prefijo = ''
): Record<string, string> {
  const resultado: Record<string, string> = {};

  for (const [clave, valor] of Object.entries(objeto)) {
    const ruta = prefijo ? `${prefijo}.${clave}` : clave;

    if (typeof valor === 'string') {
      resultado[ruta] = valor;
    } else if (valor && typeof valor === 'object') {
      Object.assign(
        resultado,
        obtenerClaves(valor as Catalogo, ruta)
      );
    }
  }

  return resultado;
}

function obtenerParametros(texto: string): string[] {
  return [...texto.matchAll(/\{\{\s*(\w+)\s*\}\}/g)]
    .map((coincidencia) => coincidencia[1])
    .sort();
}

describe('HU-48: Internacionalización ES/EN', () => {
  const clavesEs = obtenerClaves(es);
  const clavesEn = obtenerClaves(en);

  it('debe tener una traducción inglesa para cada clave española', () => {
    const faltantes = Object.keys(clavesEs).filter(
      (clave) => !(clave in clavesEn)
    );

    expect(
      faltantes,
      `Claves sin traducción inglesa:\n${faltantes.join('\n')}`
    ).toEqual([]);
  });

  it('no debe contener traducciones vacías', () => {
    const vacias = Object.entries(clavesEn)
      .filter(([, texto]) => texto.trim().length === 0)
      .map(([clave]) => clave);

    expect(
      vacias,
      `Traducciones inglesas vacías:\n${vacias.join('\n')}`
    ).toEqual([]);
  });

  it('debe mantener los mismos parámetros en ES y EN', () => {
    const diferencias: string[] = [];

    for (const [clave, textoEs] of Object.entries(clavesEs)) {
      const textoEn = clavesEn[clave];

      if (textoEn === undefined) continue;

      const parametrosEs = obtenerParametros(textoEs);
      const parametrosEn = obtenerParametros(textoEn);

      if (
        JSON.stringify(parametrosEs) !==
        JSON.stringify(parametrosEn)
      ) {
        diferencias.push(
          `${clave}: ES [${parametrosEs.join(', ')}] / EN [${parametrosEn.join(', ')}]`
        );
      }
    }

    expect(
      diferencias,
      `Parámetros diferentes:\n${diferencias.join('\n')}`
    ).toEqual([]);
  });

  it('debe tener traducciones españolas no vacías', () => {
    const vacias = Object.entries(clavesEs)
      .filter(([, texto]) => texto.trim().length === 0)
      .map(([clave]) => clave);

    expect(
      vacias,
      `Traducciones españolas vacías:\n${vacias.join('\n')}`
    ).toEqual([]);
  });
});
