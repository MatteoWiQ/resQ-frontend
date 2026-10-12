import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { RegistrarOrganizacionComponent } from './registrar-organizacion.component';
import { AuthService } from '../../../../core/services/auth.service';
import { Organizacion } from '../../../../shared/models/organizacion.model';

const URL_REPRESENTANTE = '/api/organizaciones/representante/7';
const URL_REGISTRO = '/api/organizaciones';
const URL_EDITAR = '/api/organizaciones/1';

function organizacion(extra: Partial<Organizacion> = {}): Organizacion {
  return {
    idOrganizacion: 1,
    idRepresentante: 7,
    nombre: 'Refugio Patitas',
    tipo: 'REFUGIO',
    direccion: 'Av. América 123',
    telefono: '+591 70123456',
    email: 'contacto@patitas.org',
    descripcion: null,
    horarios: null,
    zonasCobertura: null,
    logoUrl: null,
    estadoVerificacion: 'PENDIENTE_VERIFICACION',
    fechaRegistro: '2026-10-04T10:00:00',
    puedeGestionarCasos: false,
    ...extra,
  };
}

describe('RegistrarOrganizacionComponent (HU-20)', () => {
  let httpMock: HttpTestingController;
  let fixture: ComponentFixture<RegistrarOrganizacionComponent>;
  let component: RegistrarOrganizacionComponent;

  async function crear(idUsuario: number | null) {
    await TestBed.configureTestingModule({
      imports: [RegistrarOrganizacionComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: { obtenerIdUsuarioActual: () => idUsuario } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RegistrarOrganizacionComponent);
    component = fixture.componentInstance;
  }

  /** Inicia el componente respondiendo que el usuario todavía no tiene organización. */
  async function conFormulario() {
    await crear(7);
    fixture.detectChanges();
    httpMock.expectOne(URL_REPRESENTANTE).flush('no existe', { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
  }

  function llenarFormulario(): void {
    component.form = {
      nombre: 'Refugio Patitas',
      tipo: 'REFUGIO',
      direccion: 'Av. América 123',
      telefono: '+591 70123456',
      email: 'contacto@patitas.org',
      descripcion: 'Perros y gatos',
      horarios: 'Lun a Vie 9:00-18:00',
      zonasCobertura: 'Cochabamba, Quillacollo',
    };
  }

  const texto = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const archivo = (nombre: string, tipo: string, bytes = 10) =>
    new File([new Uint8Array(bytes)], nombre, { type: tipo });
  const elegir = (f: File) =>
    component.seleccionarLogo({ target: { files: [f], value: '' } } as unknown as Event);

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:vista-previa');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => httpMock.verify());

  describe('acceso', () => {
    it('sin sesión pide iniciar sesión y no consulta el backend', async () => {
      await crear(null);

      fixture.detectChanges();

      expect(texto()).toContain('Inicia sesión para registrar tu organización.');
      expect((fixture.nativeElement as HTMLElement).querySelector('form')).toBeNull();
    });

    it('un usuario sin organización ve el formulario con todos los campos', async () => {
      await conFormulario();

      const el = fixture.nativeElement as HTMLElement;
      for (const id of ['nombre', 'tipo', 'direccion', 'telefono', 'email', 'descripcion', 'logo']) {
        expect(el.querySelector('#' + id), id).not.toBeNull();
      }
      const opciones = Array.from(el.querySelectorAll('#tipo option')).map((o) => o.textContent?.trim());
      expect(opciones).toContain('Refugio');
      expect(opciones).toContain('Veterinaria');
      expect(opciones).toContain('Rescatista independiente');
    });

    it('un usuario que ya registró su organización ve su estado, no el formulario', async () => {
      await crear(7);
      fixture.detectChanges();
      httpMock.expectOne(URL_REPRESENTANTE).flush(organizacion());
      fixture.detectChanges();

      expect((fixture.nativeElement as HTMLElement).querySelector('form')).toBeNull();
      expect(texto()).toContain('Pendiente de verificación');
      expect(texto()).toContain('no puede gestionar casos');
      expect(texto()).toContain('Refugio Patitas');
    });

    it('una organización verificada se muestra como habilitada para gestionar casos', async () => {
      await crear(7);
      fixture.detectChanges();
      httpMock
        .expectOne(URL_REPRESENTANTE)
        .flush(organizacion({ estadoVerificacion: 'VERIFICADA', puedeGestionarCasos: true }));
      fixture.detectChanges();

      expect(texto()).toContain('Verificada');
      expect(texto()).toContain('puede gestionar casos');
      expect(texto()).not.toContain('no puede gestionar casos');
    });

    it('si falla la consulta muestra un error', async () => {
      await crear(7);
      fixture.detectChanges();
      httpMock.expectOne(URL_REPRESENTANTE).flush('boom', { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect(component.mensaje()).toContain('No se pudo consultar');
    });
  });

  describe('validación', () => {
    it('no envía un formulario vacío y marca los campos obligatorios', async () => {
      await conFormulario();

      component.registrar();
      fixture.detectChanges();

      expect(Object.keys(component.errores()).sort()).toEqual(['direccion', 'email', 'nombre', 'telefono', 'tipo']);
      expect(texto()).toContain('Este campo es obligatorio.');
      // httpMock.verify() en afterEach comprueba que no hubo ninguna petición
    });

    it('rechaza un email con formato inválido', async () => {
      await conFormulario();
      llenarFormulario();
      component.form.email = 'esto-no-es-un-email';

      component.registrar();

      expect(component.errores()['email']).toContain('email válido');
      expect(Object.keys(component.errores())).toEqual(['email']);
    });

    it('rechaza un teléfono con formato inválido', async () => {
      await conFormulario();
      llenarFormulario();
      component.form.telefono = 'abc';

      component.registrar();

      expect(component.errores()['telefono']).toContain('teléfono válido');
    });
  });

  describe('logo', () => {
    it('al elegir una imagen válida muestra la vista previa', async () => {
      await conFormulario();

      elegir(archivo('logo.png', 'image/png'));
      fixture.detectChanges();

      expect(component.logo()?.name).toBe('logo.png');
      const img = (fixture.nativeElement as HTMLElement).querySelector<HTMLImageElement>('.logo-preview');
      expect(img?.getAttribute('src')).toBe('blob:vista-previa');
    });

    it('rechaza un formato no permitido y no guarda el archivo', async () => {
      await conFormulario();

      elegir(archivo('logo.gif', 'image/gif'));

      expect(component.logo()).toBeNull();
      expect(component.errores()['logo']).toContain('Formato no permitido');
    });

    it('rechaza una imagen de más de 5 MB', async () => {
      await conFormulario();

      elegir(archivo('logo.png', 'image/png', 5 * 1024 * 1024 + 1));

      expect(component.logo()).toBeNull();
      expect(component.errores()['logo']).toContain('5 MB');
    });

    it('se puede quitar el logo elegido', async () => {
      await conFormulario();
      elegir(archivo('logo.png', 'image/png'));

      component.quitarLogo();

      expect(component.logo()).toBeNull();
      expect(component.vistaPrevia()).toBeNull();
    });
  });

  describe('registro', () => {
    it('registra la organización con su logo y muestra que quedó pendiente de verificación', async () => {
      await conFormulario();
      llenarFormulario();
      elegir(archivo('logo.png', 'image/png'));

      component.registrar();

      const req = httpMock.expectOne(URL_REGISTRO);
      const datos = req.request.body as FormData;
      expect(datos.get('idRepresentante')).toBe('7');
      expect(datos.get('nombre')).toBe('Refugio Patitas');
      expect((datos.get('logo') as File).name).toBe('logo.png');
      req.flush({
        organizacion: organizacion({ logoUrl: '/api/organizaciones/logos/x.png' }),
        confirmacionEnviada: true,
      });
      fixture.detectChanges();

      expect(texto()).toContain('Tu organización fue registrada.');
      expect(texto()).toContain('Te enviamos un correo de confirmación a contacto@patitas.org');
      expect(texto()).toContain('Pendiente de verificación');
      expect((fixture.nativeElement as HTMLElement).querySelector('.logo-final')).not.toBeNull();
      expect((fixture.nativeElement as HTMLElement).querySelector('form')).toBeNull();
    });

    it('si el correo no pudo enviarse, avisa pero conserva el registro', async () => {
      await conFormulario();
      llenarFormulario();

      component.registrar();
      httpMock.expectOne(URL_REGISTRO).flush({ organizacion: organizacion(), confirmacionEnviada: false });
      fixture.detectChanges();

      expect(texto()).toContain('Tu organización fue registrada.');
      expect(texto()).toContain('No pudimos enviar el correo de confirmación');
      expect(texto()).not.toContain('Te enviamos un correo');
    });

    it('un email ya registrado (409) se marca en el campo email', async () => {
      await conFormulario();
      llenarFormulario();

      component.registrar();
      httpMock.expectOne(URL_REGISTRO).flush(
        { status: 409, message: 'Ese email ya está registrado', errors: { email: 'Ya existe una organización registrada con este email' } },
        { status: 409, statusText: 'Conflict' },
      );

      expect(component.errores()['email']).toContain('Ya existe una organización');
      expect(component.enviando()).toBe(false);
      expect(component.organizacion()).toBeNull();
    });

    it('si el usuario ya tenía una organización (409) lo informa', async () => {
      await conFormulario();
      llenarFormulario();

      component.registrar();
      httpMock.expectOne(URL_REGISTRO).flush(
        { status: 409, message: 'Ya registraste una organización', errors: { idRepresentante: 'ya existe' } },
        { status: 409, statusText: 'Conflict' },
      );

      expect(component.mensaje()).toBe('Ya tienes una organización registrada.');
    });

    it('los errores de validación del backend (400) se muestran en cada campo', async () => {
      await conFormulario();
      llenarFormulario();

      component.registrar();
      httpMock.expectOne(URL_REGISTRO).flush(
        { status: 400, message: 'Revisa', errors: { telefono: 'El teléfono no tiene un formato válido' } },
        { status: 400, statusText: 'Bad Request' },
      );

      expect(component.errores()['telefono']).toBe('El teléfono no tiene un formato válido');
    });

    it('si el servidor rechaza el logo por tamaño (413) lo muestra en el logo', async () => {
      await conFormulario();
      llenarFormulario();

      component.registrar();
      httpMock.expectOne(URL_REGISTRO).flush('grande', { status: 413, statusText: 'Payload Too Large' });

      expect(component.errores()['logo']).toContain('5 MB');
      expect(component.organizacion()).toBeNull();
    });

    it('un error inesperado muestra un mensaje genérico', async () => {
      await conFormulario();
      llenarFormulario();

      component.registrar();
      httpMock.expectOne(URL_REGISTRO).flush('boom', { status: 500, statusText: 'Server Error' });

      expect(component.mensaje()).toContain('No se pudo registrar la organización');
      expect(component.enviando()).toBe(false);
    });

    it('no envía dos veces mientras hay un registro en curso', async () => {
      await conFormulario();
      llenarFormulario();

      component.registrar();
      component.registrar();

      expect(httpMock.match(URL_REGISTRO).length).toBe(1);
    });
  });

  describe('edición (HU-28)', () => {
    /** Muestra la ficha de una organización ya registrada y entra en modo edición. */
    async function iniciarEdicion(extra: Partial<Organizacion> = {}) {
      await crear(7);
      fixture.detectChanges();
      httpMock.expectOne(URL_REPRESENTANTE).flush(organizacion(extra));
      fixture.detectChanges();

      const boton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.acciones .btn-accion');
      expect(boton, 'botón editar').not.toBeNull();
      boton!.click();
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    }

    it('la ficha muestra horarios, zonas de cobertura y el botón de editar', async () => {
      await crear(7);
      fixture.detectChanges();
      httpMock
        .expectOne(URL_REPRESENTANTE)
        .flush(organizacion({ horarios: 'Lun a Vie 9:00-18:00', zonasCobertura: 'Cochabamba, Quillacollo' }));
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(texto()).toContain('Lun a Vie 9:00-18:00');
      expect(texto()).toContain('Cochabamba, Quillacollo');
      expect(el.querySelector('.acciones .btn-accion')?.textContent).toContain('Editar ficha');
      expect(el.querySelector('form')).toBeNull();
    });

    it('al editar prellena el formulario con los datos actuales', async () => {
      const el = await iniciarEdicion({ horarios: 'Lun a Vie 9:00-18:00', zonasCobertura: 'Cochabamba, Quillacollo' });

      expect(el.querySelector('form')).not.toBeNull();
      expect(component.form.nombre).toBe('Refugio Patitas');
      expect(component.form.tipo).toBe('REFUGIO');
      expect(component.form.horarios).toBe('Lun a Vie 9:00-18:00');
      expect(component.form.zonasCobertura).toBe('Cochabamba, Quillacollo');
    });

    it('guarda los cambios con PUT y vuelve al detalle', async () => {
      await iniciarEdicion();
      llenarFormulario();

      component.guardar();

      const req = httpMock.expectOne(URL_EDITAR);
      expect(req.request.method).toBe('PUT');
      const datos = req.request.body as FormData;
      expect(datos.get('horarios')).toBe('Lun a Vie 9:00-18:00');
      expect(datos.get('zonasCobertura')).toBe('Cochabamba, Quillacollo');
      req.flush(
        organizacion({ horarios: 'Lun a Vie 9:00-18:00', zonasCobertura: 'Cochabamba, Quillacollo' }),
      );
      fixture.detectChanges();

      expect(component.editando()).toBe(false);
      expect(texto()).toContain('Cambios guardados.');
      expect((fixture.nativeElement as HTMLElement).querySelector('form')).toBeNull();
    });

    it('puede quitar el logo actual al guardar', async () => {
      await iniciarEdicion({ logoUrl: '/api/organizaciones/logos/actual.png' });
      expect(texto()).toContain('Logo actual');

      component.quitarLogoExistente();
      component.guardar();

      const datos = httpMock.expectOne(URL_EDITAR).request.body as FormData;
      expect(datos.get('quitarLogo')).toBe('true');
      expect(datos.has('logo')).toBe(false);
    });

    it('adjunta el logo nuevo para reemplazar el actual', async () => {
      await iniciarEdicion({ logoUrl: '/api/organizaciones/logos/actual.png' });

      elegir(archivo('logo.png', 'image/png'));
      component.guardar();

      const datos = httpMock.expectOne(URL_EDITAR).request.body as FormData;
      expect(datos.has('quitarLogo')).toBe(false);
      expect((datos.get('logo') as File).name).toBe('logo.png');
    });

    it('cancela la edición y vuelve al detalle', async () => {
      const el = await iniciarEdicion();

      component.cancelarEdicion();
      fixture.detectChanges();

      expect(component.editando()).toBe(false);
      expect(el.querySelector('form')).toBeNull();
    });

    it('no envía cambios con datos inválidos', async () => {
      await iniciarEdicion();
      component.form.nombre = '';

      component.guardar();

      expect(component.errores()['nombre']).toBeDefined();
      expect(component.enviando()).toBe(false);
      expect(component.editando()).toBe(true);
      // httpMock.verify() en afterEach comprueba que no hubo ninguna petición
    });

    it('un error inesperado al guardar muestra un mensaje de edición', async () => {
      await iniciarEdicion();
      llenarFormulario();

      component.guardar();
      httpMock.expectOne(URL_EDITAR).flush('boom', { status: 500, statusText: 'Server Error' });

      expect(component.mensaje()).toContain('No se pudieron guardar los cambios');
      expect(component.enviando()).toBe(false);
      expect(component.editando()).toBe(true);
    });
  });
});
