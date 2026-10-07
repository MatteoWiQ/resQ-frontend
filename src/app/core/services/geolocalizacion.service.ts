import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

const PRECISION_MAXIMA = 6;

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
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
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
