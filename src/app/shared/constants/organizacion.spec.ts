import { describe, it, expect } from 'vitest';

import { REGEX_EMAIL, REGEX_TELEFONO, validarFormularioOrganizacion } from './organizacion';
import { FormularioOrganizacion } from '../models/organizacion.model';

const valido: FormularioOrganizacion = {
  nombre: 'Refugio Patitas',
  tipo: 'REFUGIO',
  direccion: 'Av. América 123',
  telefono: '+591 70123456',
  email: 'contacto@patitas.org',
  descripcion: '',
};

describe('validación del formulario de organización (HU-20)', () => {
  it('un formulario completo es válido y la descripción es opcional', () => {
    expect(validarFormularioOrganizacion(valido)).toEqual({});
  });

  it('marca todos los campos obligatorios vacíos', () => {
    const errores = validarFormularioOrganizacion({
      nombre: '  ',
      tipo: '',
      direccion: '',
      telefono: '',
      email: '',
      descripcion: '',
    });

    expect(errores).toEqual({
      nombre: 'obligatorio',
      tipo: 'obligatorio',
      direccion: 'obligatorio',
      telefono: 'obligatorio',
      email: 'obligatorio',
    });
  });

  it('valida el largo del nombre y de la descripción', () => {
    expect(validarFormularioOrganizacion({ ...valido, nombre: 'ab' }).nombre).toBe('nombreCorto');
    expect(validarFormularioOrganizacion({ ...valido, nombre: 'x'.repeat(151) }).nombre).toBe('nombreLargo');
    expect(validarFormularioOrganizacion({ ...valido, descripcion: 'x'.repeat(501) }).descripcion).toBe(
      'descripcionLarga',
    );
  });

  it('valida el formato del email', () => {
    expect(validarFormularioOrganizacion({ ...valido, email: 'no-es-email' }).email).toBe('email');
    expect(validarFormularioOrganizacion({ ...valido, email: 'a@b' }).email).toBe('email');
  });

  it('valida el formato del teléfono', () => {
    expect(validarFormularioOrganizacion({ ...valido, telefono: 'abc' }).telefono).toBe('telefono');
    expect(validarFormularioOrganizacion({ ...valido, telefono: '123' }).telefono).toBe('telefono');
  });

  it.each(['contacto@patitas.org', 'ana.perez+rescate@mail.example.com', 'a_b-c@sub.dominio.bo'])(
    'el email %s es válido',
    (email) => expect(REGEX_EMAIL.test(email)).toBe(true),
  );

  it.each(['sin-arroba.com', 'a@b', 'a@b.c', '@dominio.com', 'a@@dominio.com', 'a b@dominio.com', 'a@dominio..com', 'a@.com', 'a@dominio.com.'])(
    'el email %s es inválido',
    (email) => expect(REGEX_EMAIL.test(email)).toBe(false),
  );

  it.each(['70123456', '+591 70123456', '(4) 4123456', '591-70-123-456', '+59144123456', '1234567', '123456789012345'])(
    'el teléfono %s es válido',
    (telefono) => expect(REGEX_TELEFONO.test(telefono)).toBe(true),
  );

  it.each(['123456', '1234567890123456', 'abc1234567', '7012-345a', '591+70123456', '++59170123456', '()-- ---'])(
    'el teléfono %s es inválido',
    (telefono) => expect(REGEX_TELEFONO.test(telefono)).toBe(false),
  );
});
