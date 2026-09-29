import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

const PRECISION_MAXIMA = 6;

/**
 * false a proposito. Pedir precisión alta empuja al proveedor de red, que es el
 * camino lento. Para ordenar casos por kilometros una precisión de cientos de
 * metros no aporta nada, asi que se prefiere la respuesta rapida.
 */
const EXIGIR_PRECISION = false;

/**
 * Margen para un escaneo de red lento, para cuando todavia no hay nada en cache.
 */
const TIEMPO_MAXIMO_MS = 20000;

/**
 * En escritorio no hay GPS: Chromium pide la posicion a un proveedor de red y
 * hace backoff cuando la maquina no se mueve (10 s, 2 min, 10 min). Con
 * maximumAge en 0 le prohibimos reusar la posicion ya conocida, asi que exigia
 * una estimacion nueva que puede tardar minutos mientras el timeout cortaba
 * antes. Aceptar una cache de hasta 5 minutos es lo que hace que responde de
 * inmediato; para este caso una posicion de hace un rato sirve igual.
 */
const EDAD_MAXIMA_CACHE_MS = 5 * 60 * 1000;

const MOTIVO_POR_CODIGO: Record<number, MotivoFallaGeolocalizacion> = {
  1: 'PERMISO_DENEGADO',
  2: 'POSICION_NO_DISPONIBLE',
  3: 'TIEMPO_AGOTADO',
};

export interface PosicionGeografica {
  latitud: number;
  longitud: number;
}

export type MotivoFallaGeolocalizacion =
  | 'NO_SOPORTADA'
  | 'CONTEXTO_SEGURO'
  | 'PERMISO_DENEGADO'
  | 'POSICION_NO_DISPONIBLE'
  | 'TIEMPO_AGOTADO'
  | 'ERROR_DESCONOCIDO';

export class ErrorGeolocalizacion extends Error {
  constructor(readonly motivo: MotivoFallaGeolocalizacion) {
    super(`No se pudo obtener la ubicacion actual: ${motivo}`);
    this.name = 'ErrorGeolocalizacion';
  }
}

function redondear(coords: GeolocationCoordinates): PosicionGeografica {
  return {
    latitud: Number(coords.latitude.toFixed(PRECISION_MAXIMA)),
    longitud: Number(coords.longitude.toFixed(PRECISION_MAXIMA)),
  };
}

@Injectable({ providedIn: 'root' })
export class GeolocalizacionService {
  private readonly opciones: PositionOptions = {
    enableHighAccuracy: EXIGIR_PRECISION,
    timeout: TIEMPO_MAXIMO_MS,
    maximumAge: EDAD_MAXIMA_CACHE_MS,
  };

  obtenerPosicionActual(): Observable<PosicionGeografica> {
    const motivo = this.motivoDeFallaDeSoporte();

    if (motivo) {
      return throwError(() => new ErrorGeolocalizacion(motivo));
    }

    return new Observable<PosicionGeografica>((suscriptor) => {
      let cancelado = false;

      navigator.geolocation.getCurrentPosition(
        (posicion) => {
          if (cancelado) {
            return;
          }
          suscriptor.next(redondear(posicion.coords));
          suscriptor.complete();
        },
        (fallo) => {
          if (cancelado) {
            return;
          }
          suscriptor.error(new ErrorGeolocalizacion(this.motivoDeFalla(fallo)));
        },
        this.opciones,
      );

      return () => {
        cancelado = true;
      };
    });
  }

  private motivoDeFallaDeSoporte(): MotivoFallaGeolocalizacion | null {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return 'NO_SOPORTADA';
    }

    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      return 'CONTEXTO_SEGURO';
    }

    return null;
  }

  private motivoDeFalla(fallo: GeolocationPositionError): MotivoFallaGeolocalizacion {
    return MOTIVO_POR_CODIGO[fallo.code] ?? 'ERROR_DESCONOCIDO';
  }
}
