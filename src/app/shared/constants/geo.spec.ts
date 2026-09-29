import { distanciaEnKm } from './geo';

const KM_POR_GRADO = 6371.0088 * (Math.PI / 180);

describe('geo: distancia entre puntos (HU-41)', () => {
  const PLAZA = { latitud: -17.3895, longitud: -66.1568 };

  it('debe dar cero entre un punto y el mismo', () => {
    expect(distanciaEnKm(PLAZA, PLAZA)).toBe(0);
  });

  it('debe medir un grado de longitud sobre el ecuador', () => {
    expect(distanciaEnKm({ latitud: 0, longitud: 0 }, { latitud: 0, longitud: 1 })).toBeCloseTo(
      KM_POR_GRADO,
      2
    );
  });

  it('debe medir un grado de latitud', () => {
    expect(distanciaEnKm({ latitud: 0, longitud: 0 }, { latitud: 1, longitud: 0 })).toBeCloseTo(
      KM_POR_GRADO,
      2
    );
  });

  it('debe acortar las distancias al alejarce de la linea del ecuador', () => {
    const enEcuador = distanciaEnKm({ latitud: 0, longitud: 0 }, { latitud: 0, longitud: 1 });
    const cercaDelPolo = distanciaEnKm(
      { latitud: 60, longitud: 0 },
      { latitud: 60, longitud: 1 }
    );

    expect(cercaDelPolo).toBeLessThan(enEcuador);
  });

  it('debe ser simetrica', () => {
    const a = { latitud: -17.3895, longitud: -66.1568 };
    const b = { latitud: -17.42, longitud: -66.2 };

    expect(distanciaEnKm(a, b)).toBeCloseTo(distanciaEnKm(b, a), 10);
  });

  it('debe ordenar de menor a mayor segun la distancia real', () => {
    const cerca = distanciaEnKm(PLAZA, { latitud: -17.39, longitud: -66.157 });
    const lejos = distanciaEnKm(PLAZA, { latitud: -17.5, longitud: -66.3 });

    expect(cerca).toBeLessThan(lejos);
  });

  it('debe medir la media circunferencia entre puntos antipodales sin fallar', () => {
    const distancia = distanciaEnKm({ latitud: 0, longitud: 0 }, { latitud: 0, longitud: 180 });

    expect(Number.isNaN(distancia)).toBe(false);
    expect(distancia).toBeCloseTo(6371.0088 * Math.PI, 1);
  });

  it('debe cubrir una calle de una ciudad con precision util', () => {
    // ~110 m al norte, el orden de magnitud de una manzana
    const distancia = distanciaEnKm(PLAZA, { latitud: -17.3905, longitud: -66.1568 });

    expect(distancia).toBeCloseTo(0.111, 3);
  });
});
