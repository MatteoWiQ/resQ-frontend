import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  model,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import * as L from 'leaflet';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { CENTRO_CIUDAD, ZOOM_CIUDAD } from '../../constants/geo';

@Component({
  selector: 'app-selector-ubicacion',
  imports: [DecimalPipe, TranslatePipe],
  templateUrl: './selector-ubicacion.component.html',
  styleUrl: './selector-ubicacion.component.css',
})
export class SelectorUbicacionComponent implements AfterViewInit, OnDestroy {
  readonly latitud = model<number | null>(null);
  readonly longitud = model<number | null>(null);

  @ViewChild('mapa') private mapaRef!: ElementRef<HTMLDivElement>;

  private readonly translate = inject(TranslateService);

  private mapa?: L.Map;
  private marcador?: L.Marker;

  ngAfterViewInit(): void {
    this.mapa = L.map(this.mapaRef.nativeElement, {
      center: CENTRO_CIUDAD,
      zoom: ZOOM_CIUDAD,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.mapa);

    this.mapa.on('click', (evento: L.LeafletMouseEvent) => {
      this.colocarMarcador(evento.latlng.lat, evento.latlng.lng);
    });

    if (this.latitud() != null && this.longitud() != null) {
      this.colocarMarcador(this.latitud() as number, this.longitud() as number, false);
    }

    requestAnimationFrame(() => this.mapa?.invalidateSize());
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
  }

  quitar(): void {
    if (this.marcador) {
      this.mapa?.removeLayer(this.marcador);
      this.marcador = undefined;
    }
    this.latitud.set(null);
    this.longitud.set(null);
  }

  private colocarMarcador(lat: number, lng: number, recentrar = true): void {
    if (!this.mapa) {
      return;
    }

    if (!this.marcador) {
      this.marcador = L.marker([lat, lng], {
        draggable: true,
        title: this.translate.t('shared.ubicacionSeleccionada'),
        icon: L.divIcon({
          className: 'resq-marker',
          html: '<span class="resq-marker__pin" style="background-color: #7f2a3f"></span>',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        }),
      }).addTo(this.mapa);

      this.marcador.on('dragend', () => {
        const posicion = this.marcador?.getLatLng();
        if (posicion) {
          this.emitir(posicion.lat, posicion.lng);
        }
      });
    } else {
      this.marcador.setLatLng([lat, lng]);
    }

    if (recentrar) {
      this.mapa.panTo([lat, lng]);
    }

    this.emitir(lat, lng);
  }

  private emitir(lat: number, lng: number): void {
    this.latitud.set(Number(lat.toFixed(6)));
    this.longitud.set(Number(lng.toFixed(6)));
  }
}
