import { describe, expect, it } from 'vitest';

import { enlaceLlamada, enlaceWhatsapp, formatearTelefono, limpiarTelefono, telefonoValido } from './telefonos';

describe('telefonos (contacto de quien reporta)', () => {
  it('limpia espacios, guiones y parentesis como el backend', () => {
    expect(limpiarTelefono(' 712-345 67 ')).toBe('71234567');
    expect(limpiarTelefono('+591 (4) 449-3355')).toBe('+59144493355');
  });

  it('valida entre 7 y 15 digitos con + opcional', () => {
    expect(telefonoValido('4493355')).toBe(true);
    expect(telefonoValido('+591 71234567')).toBe(true);
    expect(telefonoValido('12345')).toBe(false);
    expect(telefonoValido('llamame')).toBe(false);
  });

  it('WhatsApp completa +591 en los numeros locales', () => {
    expect(enlaceWhatsapp('71234567')).toBe('https://wa.me/59171234567');
    expect(enlaceWhatsapp('+59171234567')).toBe('https://wa.me/59171234567');
    expect(enlaceWhatsapp('4493355')).toBe('https://wa.me/5914493355');
  });

  it('arma el enlace de llamada y muestra el numero mas legible', () => {
    expect(enlaceLlamada('712 345 67')).toBe('tel:71234567');
    expect(formatearTelefono('71234567')).toBe('712 345 67');
    expect(formatearTelefono('4493355')).toBe('4493355');
  });
});
