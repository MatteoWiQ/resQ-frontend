/** HU-10: reglas de la fotografía del reporte (deben coincidir con el backend). */
export const FOTO_TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const FOTO_EXTENSIONES_PERMITIDAS = ['.jpg', '.jpeg', '.png', '.webp'] as const;
export const FOTO_TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;
export const FOTO_ACCEPT = FOTO_TIPOS_PERMITIDOS.join(',');

export type ErrorFoto = 'FORMATO' | 'TAMANO';

/** Devuelve el motivo por el que la foto no es válida, o null si es válida. */
export function validarFoto(archivo: File): ErrorFoto | null {
  const nombre = archivo.name.toLowerCase();
  const tipoValido = archivo.type
    ? (FOTO_TIPOS_PERMITIDOS as readonly string[]).includes(archivo.type)
    : FOTO_EXTENSIONES_PERMITIDAS.some((ext) => nombre.endsWith(ext));
  if (!tipoValido) {
    return 'FORMATO';
  }
  if (archivo.size > FOTO_TAMANO_MAXIMO_BYTES) {
    return 'TAMANO';
  }
  return null;
}
