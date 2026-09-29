import { Reporte } from '../models/reporte.model';
import { Punto } from './geo';
import {
  RADIOS_CERCANIA,
  RADIO_TODOS,
  ReporteCercano,
  dentroDelRadio,
  ordenarPorDistancia,
  radioPorClave,
  reportesConDistancia,
} from './cercania';

const ORIGEN: Punto = { latitud: -17.3895, longitud: -66.1568 };

/** Un grado de latitud mide ~111.195 km sobre el radio terrestre medio. */
const KM_POR_GRADO_LATITUD = 111.195;

/** Fixtures derivados de una distancia en km para no depender de una aritmetica escrita a mano. */
function alNorte(km: number): Partial<Reporte> {
  return {
    latitud: Number((ORIGEN.latitud + km / KM_POR_GRADO_LATITUD).toFixed(6)),
    longitud: ORIGEN.longitud,
  };
}

const A_800_M_NORTE = alNorte(0.8);
const A_TRES_KM_NORTE = alNorte(3);
const A_SIETE_KM_NORTE = alNorte(7);

function reporte(idReporte: number, coords: Partial<Reporte>): Reporte {
  return {
    idReporte,
    idUsuario: 1,
    tipoCaso: 'PERDIDO',
    descripcion: `caso ${idReporte}`,
    estado: 'PENDIENTE',
    fotoUrl: null,
    fechaCreacion: '2026-01-01T00:00:00Z',
    ...coords,
  };
}

function cercano(idReporte: number, distanciaKm: number): ReporteCercano {
  return { reporte: reporte(idReporte, {}), distanciaKm };
}

describe('cercania: radios de busqueda (HU-41)', () => {
  it('debe ofrecer un radio sin limite y los tres radios acordados', () => {
    expect(RADIOS_CERCANIA.map((radio) => radio.clave)).toEqual([
      'SIN_LIMITE',
      'KM_1',
      'KM_5',
      'KM_10',
    ]);
    expect(RADIOS_CERCANIA.map((radio) => radio.km)).toEqual([null, 1, 5, 10]);
  });

  it('debe resolver cada clave a su kilometraje', () => {
    expect(radioPorClave('SIN_LIMITE').km).toBeNull();
    expect(radioPorClave('KM_1').km).toBe(1);
    expect(radioPorClave('KM_5').km).toBe(5);
    expect(radioPorClave('KM_10').km).toBe(10);
  });

  it('debe caer en el radio sin limite cuando la clave no existe', () => {
    expect(radioPorClave('KM_99' as never)).toBe(RADIO_TODOS);
  });
});

describe('cercania: calculo de distancias (HU-41)', () => {
  it('debe descartar los casos sin coordenada', () => {
    const reportes = [
      reporte(1, A_800_M_NORTE),
      reporte(2, { latitud: null, longitud: null }),
      reporte(3, {}),
      reporte(4, { latitud: -17.38, longitud: undefined }),
    ];

    const resultado = reportesConDistancia(reportes, ORIGEN);

    expect(resultado.map((caso) => caso.reporte.idReporte)).toEqual([1]);
  });

  it('debe medir la distancia del caso al origen', () => {
    const [caso] = reportesConDistancia([reporte(1, alNorte(0.8))], ORIGEN);

    expect(caso.distanciaKm).toBeCloseTo(0.8, 2);
  });

  it('debe dejar el reporte original intacto', () => {
    const original = reporte(1, A_800_M_NORTE);

    const [caso] = reportesConDistancia([original], ORIGEN);

    expect(caso.reporte).toBe(original);
  });
});

describe('cercania: filtro y orden por distancia (HU-41)', () => {
  it('debe devolver todos los casos cuando el radio no tiene limite', () => {
    const casos = [cercano(1, 0.4), cercano(2, 3), cercano(3, 25)];

    expect(dentroDelRadio(casos, null)).toHaveLength(3);
  });

  it('debe conservar los casos que caben en el radio, incluido el borde', () => {
    const casos = [cercano(1, 0.4), cercano(2, 5), cercano(3, 5.1)];

    expect(dentroDelRadio(casos, 5).map((caso) => caso.reporte.idReporte)).toEqual([1, 2]);
  });

  it('debe excluir los casos sin distancia conocida al filtrar', () => {
    const casos: ReporteCercano[] = [cercano(1, 0.4), { reporte: reporte(2, {}), distanciaKm: null }];

    expect(dentroDelRadio(casos, 10)).toHaveLength(1);
  });

  it('debe ordenar de menor a mayor distancia', () => {
    const ordenados = ordenarPorDistancia([cercano(1, 8), cercano(2, 1.2), cercano(3, 4)]);

    expect(ordenados.map((caso) => caso.reporte.idReporte)).toEqual([2, 3, 1]);
  });

  it('debe enviar al final los casos sin distancia conocida', () => {
    const ordenados = ordenarPorDistancia([
      { reporte: reporte(1, {}), distanciaKm: null },
      cercano(2, 3),
    ]);

    expect(ordenados.map((caso) => caso.reporte.idReporte)).toEqual([2, 1]);
  });

  it('debe ordenar una copia y no modificar la lista recibida', () => {
    const casos = [cercano(1, 8), cercano(2, 1.2)];

    ordenarPorDistancia(casos);

    expect(casos.map((caso) => caso.reporte.idReporte)).toEqual([1, 2]);
  });
});

describe('cercania: busqueda completa por cercania (HU-41)', () => {
  const reportes = [
    reporte(10, A_SIETE_KM_NORTE),
    reporte(11, { latitud: null, longitud: null }),
    reporte(12, A_800_M_NORTE),
    reporte(13, A_TRES_KM_NORTE),
  ];

  function buscar(km: number | null): number[] {
    return ordenarPorDistancia(dentroDelRadio(reportesConDistancia(reportes, ORIGEN), km)).map(
      (caso) => caso.reporte.idReporte
    );
  }

  it('debe ordenar todos los casos con coordenadas cuando no hay limite', () => {
    expect(buscar(null)).toEqual([12, 13, 10]);
  });

  it('debe quedarse solo con el caso mas cercano dentro de 1 km', () => {
    expect(buscar(1)).toEqual([12]);
  });

  it('debe quedarse con los dos casos mas cercanos dentro de 5 km', () => {
    expect(buscar(5)).toEqual([12, 13]);
  });

  it('debe quedarse con los tres casos dentro de 10 km', () => {
    expect(buscar(10)).toEqual([12, 13, 10]);
  });
});
