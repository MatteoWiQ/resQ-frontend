export interface Usuario {
  idUsuario: number;
  nombre: string;
  email: string;
  telefono: string;
  rol: string;
  fechaRegistro?: string;

  // fotoUrl?: string;
}

export interface UsuarioActual {
  idUsuario: number;
  email: string;
  rol: string;
}