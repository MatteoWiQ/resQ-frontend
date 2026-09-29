import { Observable } from 'rxjs';

import {
  ErrorGeolocalizacion,
  GeolocalizacionService,
  PosicionGeografica,
} from './geolocalizacion.service';

type CallbackPosicion = (posicion: GeolocationPosition) => void;
type CallbackFalla = (fallo: GeolocationPositionError) => void;

interface RegistroLlamadas {
  exito: CallbackPosicion[];
  fallo: CallbackFalla[];
  opciones: (PositionOptions | undefined)[];
}

function instalarGeolocalizacion(
  implementar?: (
    exito: CallbackPosicion,
    fallo: CallbackFalla,
    opciones?: PositionOptions,
  ) => void
): RegistroLlamadas {
  const registro: RegistroLlamadas = { exito: [], fallo: [], opciones: [] };

  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: (
        exito: CallbackPosicion,
        fallo: CallbackFalla,
        opciones?: PositionOptions,
      ) => {
        registro.exito.push(exito);
        registro.fallo.push(fallo);
        registro.opciones.push(opciones);
        implementar?.(exito, fallo, opciones);
      },
    },
  });

  return registro;
}

function quitarGeolocalizacion(): void {
  Reflect.deleteProperty(navigator, 'geolocation');
}

function fijarContextoSeguro(valor: boolean): void {
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: valor });
}

function posicion(latitud: number, longitud: number): GeolocationPosition {
  return {
    coords: {
      latitude: latitud,
      longitude: longitud,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: 0,
  } as GeolocationPosition;
}

function falloConCodigo(codigo: number): GeolocationPositionError {
  return { code: codigo, message: 'error de prueba', PERMISSION_DENIED: 1 } as GeolocationPositionError;
}

function motivoDelError(observable: Observable<PosicionGeografica>): string {
  let motivo = 'NO_SE_EMITIO_ERROR';

  observable.subscribe({
    error: (fallo) => {
      motivo = fallo instanceof ErrorGeolocalizacion ? fallo.motivo : 'ERROR_NO_GEOLOCALIZACION';
    },
  });

  return motivo;
}

describe('GeolocalizacionService: ubicacion actual del dispositivo (HU-16)', () => {
  const servicio = new GeolocalizacionService();

  afterEach(() => {
    quitarGeolocalizacion();
    fijarContextoSeguro(true);
  });

  it('debe entregar la posicion actual con seis decimales', () => {
    instalarGeolocalizacion((exito) => exito(posicion(-17.3895123456, -66.1567987654)));
    let recibida: PosicionGeografica | undefined;

    servicio.obtenerPosicionActual().subscribe((valor) => (recibida = valor));

    expect(recibida).toEqual({ latitud: -17.389512, longitud: -66.156799 });
  });

  it('debe pedir la posicion rapido y aceptando una cache reciente', () => {
    const registro = instalarGeolocalizacion((exito) => exito(posicion(0, 0)));

    servicio.obtenerPosicionActual().subscribe();

    // Sin cache aceptada ni margen de red, un escritorio sin GPS agota el
    // timeout antes de que el proveedor de red responda.
    expect(registro.opciones[0]).toEqual({
      enableHighAccuracy: false,
      timeout: 20000,
      maximumAge: 300000,
    });
  });

  it('debe informar que el dispositivo no permite obtener la ubicacion', () => {
    quitarGeolocalizacion();

    expect(motivoDelError(servicio.obtenerPosicionActual())).toBe('NO_SOPORTADA');
  });

  it('debe informar que hace falta una conexion segura sin consultar al navegador', () => {
    let pedidos = 0;
    instalarGeolocalizacion(() => {
      pedidos += 1;
    });
    fijarContextoSeguro(false);

    expect(motivoDelError(servicio.obtenerPosicionActual())).toBe('CONTEXTO_SEGURO');
    expect(pedidos).toBe(0);
  });

  it('debe informar que el permiso fue denegado', () => {
    instalarGeolocalizacion((_exito, fallo) => fallo(falloConCodigo(1)));

    expect(motivoDelError(servicio.obtenerPosicionActual())).toBe('PERMISO_DENEGADO');
  });

  it('debe informar que la posicion no esta disponible', () => {
    instalarGeolocalizacion((_exito, fallo) => fallo(falloConCodigo(2)));

    expect(motivoDelError(servicio.obtenerPosicionActual())).toBe('POSICION_NO_DISPONIBLE');
  });

  it('debe informar que se agoto el tiempo de espera', () => {
    instalarGeolocalizacion((_exito, fallo) => fallo(falloConCodigo(3)));

    expect(motivoDelError(servicio.obtenerPosicionActual())).toBe('TIEMPO_AGOTADO');
  });

  it('debe informar un motivo desconocido cuando el navegador inventa un codigo', () => {
    instalarGeolocalizacion((_exito, fallo) => fallo(falloConCodigo(99)));

    expect(motivoDelError(servicio.obtenerPosicionActual())).toBe('ERROR_DESCONOCIDO');
  });

  it('no debe entregar nada si el suscriptor se da de baja antes de la respuesta', () => {
    const registro = instalarGeolocalizacion();
    const recibidas: PosicionGeografica[] = [];
    const suscripcion = servicio
      .obtenerPosicionActual()
      .subscribe((valor) => recibidas.push(valor));

    suscripcion.unsubscribe();
    registro.exito[0](posicion(-17.3895, -66.1568));

    expect(recibidas).toEqual([]);
  });
});
