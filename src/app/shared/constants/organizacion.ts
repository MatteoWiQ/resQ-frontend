import { FormularioOrganizacion, TipoOrganizacion } from '../models/organizacion.model';

/**
 * HU-20: reglas del formulario de organización. Deben coincidir con las del backend.
 * El logo usa las mismas reglas de imagen que la foto del reporte (shared/constants/foto.ts).
 */
export const TIPOS_ORGANIZACION: readonly TipoOrganizacion[] = [
  'REFUGIO',
  'VETERINARIA',
  'RESCATISTA_INDEPENDIENTE',
];

/** Opcional "+", solo dígitos, espacios, paréntesis y guiones; entre 7 y 15 dígitos. */
export const REGEX_TELEFONO = /^(?=(?:\D*\d){7,15}\D*$)\+?[\d ()-]+$/;

/** Exige dominio con punto y extensión de al menos 2 letras. */
export const REGEX_EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export const NOMBRE_MIN = 3;
export const NOMBRE_MAX = 150;
export const DIRECCION_MAX = 255;
export const DESCRIPCION_MAX = 500;

/** Código del error; el componente lo traduce a texto con i18n. */
export type CodigoErrorOrganizacion =
  | 'obligatorio'
  | 'nombreCorto'
  | 'nombreLargo'
  | 'direccionLarga'
  | 'telefono'
  | 'email'
  | 'descripcionLarga';

export type ErroresOrganizacion = Partial<Record<keyof FormularioOrganizacion, CodigoErrorOrganizacion>>;

/** Valida los campos del formulario. Devuelve un mapa campo → código; vacío si todo es válido. */
export function validarFormularioOrganizacion(form: FormularioOrganizacion): ErroresOrganizacion {
  const errores: ErroresOrganizacion = {};
  const nombre = form.nombre.trim();
  const direccion = form.direccion.trim();
  const telefono = form.telefono.trim();
  const email = form.email.trim();

  if (!nombre) {
    errores.nombre = 'obligatorio';
  } else if (nombre.length < NOMBRE_MIN) {
    errores.nombre = 'nombreCorto';
  } else if (nombre.length > NOMBRE_MAX) {
    errores.nombre = 'nombreLargo';
  }

  if (!form.tipo) {
    errores.tipo = 'obligatorio';
  }

  if (!direccion) {
    errores.direccion = 'obligatorio';
  } else if (direccion.length > DIRECCION_MAX) {
    errores.direccion = 'direccionLarga';
  }

  if (!telefono) {
    errores.telefono = 'obligatorio';
  } else if (!REGEX_TELEFONO.test(telefono)) {
    errores.telefono = 'telefono';
  }

  if (!email) {
    errores.email = 'obligatorio';
  } else if (!REGEX_EMAIL.test(email)) {
    errores.email = 'email';
  }

  if (form.descripcion.trim().length > DESCRIPCION_MAX) {
    errores.descripcion = 'descripcionLarga';
  }

  return errores;
}
