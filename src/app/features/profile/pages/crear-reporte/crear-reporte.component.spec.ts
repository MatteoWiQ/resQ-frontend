import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CLAVE_BORRADOR, CrearReporteComponent } from './crear-reporte.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ReporteService } from '../../../../core/services/reporte.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { Reporte } from '../../../../shared/models/reporte.model';
import { Usuario } from '../../../../shared/models/usuario.model';

type DatosReporte = Parameters<ReporteService['crearReporte']>[0];

const CREADO: Reporte = {
  idReporte: 42,
  idUsuario: 7,
  tipoCaso: 'ABANDONADA',
  descripcion: 'x',
  estado: 'PENDIENTE',
  fotoUrl: null,
  fechaCreacion: '2026-11-13T10:00:00',
};

function cuenta(telefono: string | null): Usuario {
  return { idUsuario: 7, nombre: 'Ana Quiroga', email: 'ana@resq.com', telefono: telefono as string, rol: 'USUARIO', tiposAyuda: [] };
}

describe('CrearReporteComponent: Reportar en 4 pasos (rediseño)', () => {
  let fixture: ComponentFixture<CrearReporteComponent>;
  let component: CrearReporteComponent;
  let enviados: DatosReporte[];
  let usuarios: { obtenerPorId: ReturnType<typeof vi.fn>; actualizarMiContacto: ReturnType<typeof vi.fn> };
  let reportes: { crearReporte: ReturnType<typeof vi.fn>; subirFoto: ReturnType<typeof vi.fn> };
  let navegar: ReturnType<typeof vi.spyOn>;

  async function crear(opciones: { sesion?: boolean; telefono?: string | null } = {}): Promise<void> {
    const { sesion = true, telefono = '71234567' } = opciones;
    enviados = [];
    usuarios = {
      obtenerPorId: vi.fn(() => of(cuenta(telefono))),
      actualizarMiContacto: vi.fn((d: { telefono: string }) => of(cuenta(d.telefono))),
    };
    reportes = {
      crearReporte: vi.fn((datos: DatosReporte): Observable<Reporte> => {
        enviados.push(datos);
        return of(CREADO);
      }),
      subirFoto: vi.fn(() => of({ fotoUrl: '/api/reportes/fotos/abc.jpg' })),
    };
    await TestBed.configureTestingModule({
      imports: [CrearReporteComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: AuthService, useValue: { obtenerIdUsuarioActual: () => (sesion ? 7 : null) } },
        { provide: ReporteService, useValue: reportes },
        { provide: UsuarioService, useValue: usuarios },
      ],
    }).compileComponents();
    navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(CrearReporteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const dom = () => fixture.nativeElement as HTMLElement;
  const titulo = () => dom().querySelector('h1')?.textContent?.trim();

  function boton(texto: string): HTMLButtonElement {
    const b = Array.from(dom().querySelectorAll<HTMLButtonElement>('button')).find((x) => x.textContent?.includes(texto));
    if (!b) {
      throw new Error(`No hay boton "${texto}"`);
    }
    return b;
  }

  function hasta(paso: 3 | 4): void {
    boton('Continuar sin foto').click();
    fixture.detectChanges();
    boton('Continuar').click();
    fixture.detectChanges();
    if (paso === 4) {
      component.seleccionarTipo('ABANDONADA');
      component.form.descripcion = 'Perro herido junto a la parada';
      boton('Continuar').click();
      fixture.detectChanges();
    }
  }

  beforeEach(() => localStorage.clear());

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('sin sesion pide iniciar sesion y no muestra los pasos', async () => {
    await crear({ sesion: false });

    expect(titulo()).toBe('Inicia sesión para reportar');
    expect(dom().querySelector('.pasos')).toBeNull();
    expect(dom().querySelector('a.boton-principal')?.getAttribute('href')).toBe('/login');
  });

  it('muestra los 4 pasos y no tiene el menu del sitio', async () => {
    await crear();

    const pasos = Array.from(dom().querySelectorAll('.pasos li')).map((li) => li.textContent?.trim());
    expect(pasos).toEqual(['1 · Foto', '2 · Ubicación', '3 · Situación', '4 · Contacto']);
    expect(dom().querySelector('.pasos li[aria-current="step"]')?.textContent).toContain('Foto');
    expect(dom().querySelector('app-header')).toBeNull();
    expect(dom().textContent).toContain('Guardar y salir');
  });

  it('la foto es opcional: se puede continuar sin foto', async () => {
    await crear();
    expect(titulo()).toBe('¿Puedes sacarle una foto?');

    boton('Continuar sin foto').click();
    fixture.detectChanges();

    expect(titulo()).toBe('¿Dónde está el animal?');
    expect(dom().querySelector('.pasos li.hecho')?.textContent).toContain('Foto');
  });

  it('no deja pasar de Situacion sin tipo de caso ni descripcion', async () => {
    await crear();
    hasta(3);

    boton('Continuar').click();
    fixture.detectChanges();
    expect(dom().querySelector('.error')?.textContent).toContain('Elige el tipo de caso.');

    component.seleccionarTipo('PERDIDA');
    boton('Continuar').click();
    fixture.detectChanges();
    expect(dom().querySelector('.error')?.textContent).toContain('Cuéntanos lo que viste.');
    expect(titulo()).toBe('¿Qué está pasando?');
  });

  it('envia el reporte con la referencia al final de la descripcion y abre el caso nuevo', async () => {
    await crear();
    boton('Continuar sin foto').click();
    fixture.detectChanges();
    component.form.referencia = 'Frente a la farmacia';
    boton('Continuar').click();
    fixture.detectChanges();
    component.seleccionarTipo('ABANDONADA');
    component.form.descripcion = 'Perro herido';
    boton('Continuar').click();
    fixture.detectChanges();

    boton('Enviar reporte').click();

    expect(enviados[0].tipoCaso).toBe('ABANDONADA');
    expect(enviados[0].descripcion).toBe('Perro herido\n\nReferencia: Frente a la farmacia');
    expect(enviados[0].compartirTelefonoCuenta).toBe(false);
    expect(enviados[0].telefonoContacto).toBeNull();
    expect(navegar).toHaveBeenCalledWith(['/casos', 42]);
  });

  it('en Contacto se puede mostrar el telefono de la cuenta y otro para el caso', async () => {
    await crear();
    hasta(4);

    expect(dom().textContent).toContain('Mostrar el teléfono de mi cuenta (712 345 67)');
    component.form.compartirTelefonoCuenta = true;
    component.form.telefonoContacto = '600-111 22';
    boton('Enviar reporte').click();

    expect(enviados[0].compartirTelefonoCuenta).toBe(true);
    expect(enviados[0].telefonoContacto).toBe('60011122');
    expect(dom().querySelector('.aviso-estafas')?.textContent).toContain('ResQ nunca te pedirá dinero');
  });

  it('un telefono del caso invalido bloquea el envio', async () => {
    await crear();
    hasta(4);

    const campo = dom().querySelector<HTMLInputElement>('input[name="telefonoContacto"]')!;
    campo.value = 'abc';
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(boton('Enviar reporte').disabled).toBe(true);
    component.crearReporte();
    expect(enviados).toHaveLength(0);
  });

  it('si la cuenta no tiene telefono se puede agregar ahi mismo', async () => {
    await crear({ telefono: null });
    hasta(4);

    expect(dom().textContent).toContain('Tu cuenta no tiene teléfono.');
    component.form.telefonoNuevo = '7 123 4567';
    boton('Agregar a mi cuenta').click();
    fixture.detectChanges();

    expect(usuarios.actualizarMiContacto).toHaveBeenCalledWith({ telefono: '71234567' });
    expect(component.form.compartirTelefonoCuenta).toBe(true);
    expect(dom().textContent).toContain('Mostrar el teléfono de mi cuenta (712 345 67)');
  });

  it('sube la foto primero y crea el reporte con su URL', async () => {
    await crear();
    const foto = new File([new Uint8Array([1])], 'perro.jpg', { type: 'image/jpeg' });
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    component.seleccionarFoto({ target: { files: [foto], value: '' } } as unknown as Event);
    fixture.detectChanges();
    boton('Continuar').click();
    fixture.detectChanges();
    boton('Continuar').click();
    fixture.detectChanges();
    component.seleccionarTipo('PERDIDA');
    component.form.descripcion = 'Gata perdida';
    boton('Continuar').click();
    fixture.detectChanges();

    boton('Enviar reporte').click();

    expect(reportes.subirFoto).toHaveBeenCalledWith(foto);
    expect(enviados[0].fotoUrl).toBe('/api/reportes/fotos/abc.jpg');
  });

  it('si el backend rechaza el reporte muestra su motivo', async () => {
    await crear();
    hasta(4);
    reportes.crearReporte.mockReturnValue(
      throwError(() => ({ status: 400, error: { message: 'Tu cuenta no tiene un teléfono registrado' } })),
    );

    boton('Enviar reporte').click();
    fixture.detectChanges();

    expect(dom().querySelector('.error')?.textContent).toContain('Tu cuenta no tiene un teléfono registrado');
  });

  it('"Guardar y salir" guarda un borrador y al volver se recupera', async () => {
    await crear();
    hasta(3);
    component.seleccionarTipo('ENCONTRADA');
    component.form.descripcion = 'Gata con crías';

    boton('Guardar y salir').click();
    expect(navegar).toHaveBeenCalledWith(['/']);
    expect(JSON.parse(localStorage.getItem(CLAVE_BORRADOR)!)).toMatchObject({ paso: 3, tipoCaso: 'ENCONTRADA' });

    TestBed.resetTestingModule();
    await crear();
    expect(titulo()).toBe('¿Qué está pasando?');
    expect(component.form.descripcion).toBe('Gata con crías');
    expect(dom().querySelector('.aviso')?.textContent).toContain('Recuperamos tu reporte sin terminar.');

    boton('Empezar de nuevo').click();
    fixture.detectChanges();
    expect(titulo()).toBe('¿Puedes sacarle una foto?');
    expect(localStorage.getItem(CLAVE_BORRADOR)).toBeNull();
  });

  it('al enviar se borra el borrador', async () => {
    await crear();
    hasta(4);
    localStorage.setItem(CLAVE_BORRADOR, '{"paso":4}');

    boton('Enviar reporte').click();

    expect(localStorage.getItem(CLAVE_BORRADOR)).toBeNull();
  });

  it('muestra los consejos y los telefonos de emergencia de Cochabamba', async () => {
    await crear();

    expect(dom().querySelector('.consejos a')?.getAttribute('href')).toBe('/guia-reporte');
    const emergencias = Array.from(dom().querySelectorAll('.emergencia a')).map((a) => a.getAttribute('href'));
    expect(emergencias).toEqual(['tel:123', 'tel:4493355']);
  });
});
