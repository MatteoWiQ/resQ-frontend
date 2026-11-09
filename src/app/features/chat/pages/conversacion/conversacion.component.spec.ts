import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { computed, signal } from '@angular/core';

import { ConversacionComponent } from './conversacion.component';
import { AuthService } from '../../../../core/services/auth.service';
import { MensajeService } from '../../../../core/services/mensaje.service';
import { NotificacionService } from '../../../../core/services/notificacion.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { Mensaje } from '../../../../shared/models/mensaje.model';

function mensaje(id: number, extra: Partial<Mensaje> = {}): Mensaje {
  return {
    idMensaje: id,
    idConversacion: 1,
    idEmisor: 9,
    tipo: 'TEXTO',
    contenido: `Mensaje ${id}`,
    urlAdjunto: null,
    nombreAdjunto: null,
    fechaEnvio: '2026-10-01T10:00:00',
    eliminado: false,
    ...extra,
  };
}

describe('ConversacionComponent (HU-27)', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<ConversacionComponent>;
  let componente: ConversacionComponent;
  let mensajeService: {
    obtenerMensajes: (id: number) => Observable<Mensaje[]>;
    obtenerConversaciones: () => Observable<unknown[]>;
    enviarMensaje: (id: number, contenido: string, archivo?: File | null) => Observable<Mensaje>;
    eliminarMensaje: (id: number) => Observable<void>;
  };

  beforeEach(() => {
    mensajeService = {
      obtenerMensajes: () => of([mensaje(2), mensaje(1)]),
      obtenerConversaciones: () =>
        of([{ idConversacion: 1, idOtroUsuario: 9, nombre: 'Ana Torres', esOrganizacion: false, ultimoMensaje: '', fechaUltimoMensaje: null }]),
      enviarMensaje: vi.fn(() => of(mensaje(3, { idEmisor: 10 }))),
      eliminarMensaje: vi.fn(() => of(undefined)),
    };

    TestBed.configureTestingModule({
      imports: [ConversacionComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (clave: string) => (clave === 'id' ? '1' : null) } } },
        },
        { provide: AuthService, useValue: { obtenerIdUsuarioActual: () => 10, usuarioActual: () => ({ idUsuario: 10 }), esAdmin: () => false, logout: () => undefined } },
        { provide: MensajeService, useValue: mensajeService },
        {
          provide: NotificacionService,
          useValue: { cargar: () => of([]), notificaciones: signal([]).asReadonly(), noLeidas: computed(() => 0), limpiar: () => undefined },
        },
        { provide: WebSocketService, useValue: { enEvento: () => of() } },
      ],
    });

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ConversacionComponent);
    componente = fixture.componentInstance;
  });

  const texto = () => (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.conversacion-card')!.textContent ?? '';

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it('carga el historial y muestra los mensajes del mas reciente al mas antiguo', () => {
    fixture.detectChanges();

    expect(componente.mensajes().map((m) => m.idMensaje)).toEqual([2, 1]);
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.mensaje').length).toBe(2);
  });

  it('indica el remitente: el nombre del otro usuario o "Tu" cuando es propio', () => {
    fixture.detectChanges();

    const remitentes = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.remitente'),
    ).map((el) => el.textContent?.trim());
    expect(remitentes).toEqual(['Ana Torres', 'Ana Torres']);

    componente.mensajes.set([mensaje(9, { idEmisor: 10 })]);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.remitente')?.textContent?.trim()).toBe('Tú');
  });

  it('renderiza el texto enriquecido escapando etiquetas', () => {
    fixture.detectChanges();
    componente.mensajes.set([mensaje(1, { contenido: 'Hola **Ana** <b>x</b>' })]);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.texto')?.innerHTML).toBe(
      'Hola <strong>Ana</strong> &lt;b&gt;x&lt;/b&gt;',
    );
  });

  it('un mensaje eliminado se muestra como eliminado', () => {
    fixture.detectChanges();
    componente.mensajes.set([mensaje(1, { eliminado: true, contenido: '' })]);
    fixture.detectChanges();

    expect(texto()).toContain('Mensaje eliminado');
  });

  it('cuenta los caracteres y bloquea el envio al pasarse del limite', () => {
    fixture.detectChanges();

    componente.borrador.set('x'.repeat(componente.maxCaracteres + 1));
    fixture.detectChanges();

    const boton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(boton.disabled).toBe(true);
    expect(componente.caracteres).toBe(componente.maxCaracteres + 1);

    componente.borrador.set('hola');
    fixture.detectChanges();
    expect(boton.disabled).toBe(false);
    expect((fixture.nativeElement as HTMLElement).querySelector('.contador')?.textContent).toContain(
      `4/${componente.maxCaracteres}`,
    );
  });

  it('no envia un mensaje vacio', () => {
    fixture.detectChanges();

    componente.borrador.set('   ');
    componente.enviar();
    fixture.detectChanges();

    expect(mensajeService.enviarMensaje).not.toHaveBeenCalled();
    expect(texto()).toContain(
      'Escribe un mensaje o adjunta un archivo',
    );
  });

  it('envia el mensaje y lo pone al principio del historial', () => {
    fixture.detectChanges();

    componente.borrador.set('Nos vemos');
    componente.enviar();

    expect(mensajeService.enviarMensaje).toHaveBeenCalledWith(1, 'Nos vemos', null);
    expect(componente.mensajes()[0].idMensaje).toBe(3);
    expect(componente.borrador()).toBe('');
  });

  it('adjunta un archivo y lo incluye al enviar', () => {
    fixture.detectChanges();

    const archivo = new File(['abc'], 'informe.pdf', { type: 'application/pdf' });
    const input = { files: [archivo] } as unknown as HTMLInputElement;
    componente.seleccionarAdjunto({ target: input } as unknown as Event);
    fixture.detectChanges();

    expect(texto()).toContain('informe.pdf');

    componente.borrador.set('Te paso el informe');
    componente.enviar();

    expect(mensajeService.enviarMensaje).toHaveBeenCalledWith(1, 'Te paso el informe', archivo);
  });

  it('permite quitar el adjunto elegido', () => {
    fixture.detectChanges();

    componente.seleccionarAdjunto({
      target: { files: [new File(['a'], 'foto.png')] } as unknown as HTMLInputElement,
    } as unknown as Event);
    fixture.detectChanges();

    componente.quitarAdjunto();
    fixture.detectChanges();

    expect(componente.adjunto()).toBeNull();
  });

  it('solo deja eliminar los mensajes propios', () => {
    fixture.detectChanges();
    componente.mensajes.set([mensaje(1, { idEmisor: 10 }), mensaje(2, { idEmisor: 9 })]);
    fixture.detectChanges();

    const botones = (fixture.nativeElement as HTMLElement).querySelectorAll('.btn-eliminar');
    expect(botones.length).toBe(1);

    (botones[0] as HTMLButtonElement).click();
    expect(mensajeService.eliminarMensaje).toHaveBeenCalledWith(1);
  });

  it('aplica negrita, cursiva y monoespaciado a la seleccion', () => {
    fixture.detectChanges();
    const area = (fixture.nativeElement as HTMLElement).querySelector<HTMLTextAreaElement>('.redactar textarea')!;
    area.value = 'texto';
    componente.borrador.set('texto');
    area.setSelectionRange(0, 5);

    componente.envolver('**');
    expect(componente.borrador()).toBe('**texto**');
  });
});
