import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { Register } from './register';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  async function crear(registro: { ok?: boolean; statusError?: number }) {
    const authMock = {
      register: () =>
        registro.ok
          ? of({})
          : throwError(() => ({ status: registro.statusError })),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([]), { provide: AuthService, useValue: authMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    await fixture.whenStable();
    return component;
  }

  it('should create', async () => {
    await crear({ ok: true });
    expect(component).toBeTruthy();
  });

  it('muestra el mensaje de exito cuando el registro funciona', async () => {
    const c = await crear({ ok: true });

    c.onRegister();

    expect(c.message()).toContain('registrado');
  });

  it('explica que el correo ya existe ante un 409', async () => {
    const c = await crear({ ok: false, statusError: 409 });

    c.onRegister();

    expect(c.message()).toContain('ya tiene una cuenta');
  });

  it('pide revisar los datos ante un 400', async () => {
    const c = await crear({ ok: false, statusError: 400 });

    c.onRegister();

    expect(c.message()).toContain('Revisa los datos');
  });

  it('cae al mensaje generico ante un error de conexion', async () => {
    const c = await crear({ ok: false, statusError: 0 });

    c.onRegister();

    expect(c.message()).toContain('No se pudo conectar');
  });
});
