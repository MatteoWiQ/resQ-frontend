/**
 * Contacto de quien reporta: telefonos con las mismas reglas que el backend
 * (validation/Telefonos.java): se aceptan espacios, guiones y parentesis y se
 * guarda limpio, con "+" opcional y de 7 a 15 digitos.
 */
export function limpiarTelefono(telefono: string | null | undefined): string {
  return (telefono ?? '').trim().replace(/[\s()-]/g, '');
}

export function telefonoValido(telefono: string | null | undefined): boolean {
  return /^\+?[0-9]{7,15}$/.test(limpiarTelefono(telefono));
}

/** Codigo de pais de Bolivia para los numeros locales (7 u 8 digitos). */
const CODIGO_BOLIVIA = '591';

/** Enlace para escribir por WhatsApp. Los numeros locales se completan con +591. */
export function enlaceWhatsapp(telefono: string): string {
  const limpio = limpiarTelefono(telefono);
  const digitos = limpio.replace('+', '');
  const internacional = limpio.startsWith('+') || digitos.length > 8 ? digitos : CODIGO_BOLIVIA + digitos;
  return `https://wa.me/${internacional}`;
}

export function enlaceLlamada(telefono: string): string {
  return `tel:${limpiarTelefono(telefono)}`;
}

/** "71234567" -> "712 345 67" para leerlo mejor. Los demas se muestran tal cual. */
export function formatearTelefono(telefono: string): string {
  const limpio = limpiarTelefono(telefono);
  return /^[0-9]{8}$/.test(limpio) ? `${limpio.slice(0, 3)} ${limpio.slice(3, 6)} ${limpio.slice(6)}` : limpio;
}
