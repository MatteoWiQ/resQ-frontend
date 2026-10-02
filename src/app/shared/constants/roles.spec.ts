import { ROLES_VALIDOS, esAdmin, esVoluntario, normalizarRol } from './roles';

describe('roles', () => {
  it('expone exactamente los tres roles del seed de la base de datos', () => {
    expect(ROLES_VALIDOS).toEqual(['USUARIO', 'VOLUNTARIO', 'ADMIN']);
  });

  describe('normalizarRol', () => {
    it('pasa a mayusculas', () => {
      expect(normalizarRol('admin')).toBe('ADMIN');
    });

    it('recorta espacios', () => {
      expect(normalizarRol('  voluntario ')).toBe('VOLUNTARIO');
    });

    it('devuelve null cuando no hay rol', () => {
      expect(normalizarRol(null)).toBeNull();
      expect(normalizarRol(undefined)).toBeNull();
      expect(normalizarRol('   ')).toBeNull();
    });
  });

  describe('esAdmin', () => {
    it('reconoce el rol canonico ADMIN', () => {
      expect(esAdmin('ADMIN')).toBe(true);
      expect(esAdmin('admin')).toBe(true);
      expect(esAdmin(' Admin ')).toBe(true);
    });

    it('no confunde ADMINISTRADOR con ADMIN', () => {
      // Regresion: el topbar comparaba contra 'ADMINISTRADOR', que no existe
      // en la base de datos, asi que el enlace nunca le aparecia a nadie.
      expect(esAdmin('ADMINISTRADOR')).toBe(false);
    });

    it('rechaza los demas roles y los valores vacios', () => {
      expect(esAdmin('USUARIO')).toBe(false);
      expect(esAdmin('VOLUNTARIO')).toBe(false);
      expect(esAdmin(null)).toBe(false);
      expect(esAdmin(undefined)).toBe(false);
    });
  });

  describe('esVoluntario', () => {
    it('reconoce el rol voluntario sin importar mayusculas', () => {
      expect(esVoluntario('VOLUNTARIO')).toBe(true);
      expect(esVoluntario('voluntario')).toBe(true);
    });

    it('rechaza los demas roles', () => {
      expect(esVoluntario('USUARIO')).toBe(false);
      expect(esVoluntario('ADMIN')).toBe(false);
      expect(esVoluntario(null)).toBe(false);
    });
  });
});
