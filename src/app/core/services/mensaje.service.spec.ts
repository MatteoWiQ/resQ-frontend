import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { MensajeService } from './mensaje.service';

describe('MensajeService (HU-27)', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  const servicio = () => TestBed.inject(MensajeService);

  it('pide mis conversaciones', () => {
    servicio()
      .obtenerConversaciones()
      .subscribe();

    const req = http.expectOne('/api/conversaciones');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('abre una conversacion con una organizacion', () => {
    servicio()
      .abrirConversacion({ idOrganizacion: 3 })
      .subscribe();

    const req = http.expectOne('/api/conversaciones');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ idOrganizacion: 3 });
    req.flush({ idConversacion: 1, idOtroUsuario: 9, nombre: 'Patitas', esOrganizacion: true, ultimoMensaje: '', fechaUltimoMensaje: null });
  });

  it('envia el mensaje como multipart con el contenido y el adjunto', () => {
    const archivo = new File(['abc'], 'foto.png', { type: 'image/png' });

    servicio()
      .enviarMensaje(1, 'Hola', archivo)
      .subscribe();

    const req = http.expectOne('/api/conversaciones/1/mensajes');
    expect(req.request.method).toBe('POST');
    const cuerpo = req.request.body as FormData;
    expect(cuerpo.get('contenido')).toBe('Hola');
    // jsdom envuelve el archivo en su propia envoltura: se comprueba por nombre y tipo.
    const adjunto = cuerpo.get('archivo') as File;
    expect(adjunto).toBeInstanceOf(File);
    expect(adjunto.name).toBe('foto.png');
    expect(adjunto.type).toBe('image/png');
    req.flush({});
  });

  it('elimina un mensaje propio', () => {
    servicio()
      .eliminarMensaje(7)
      .subscribe();

    const req = http.expectOne('/api/mensajes/7');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
