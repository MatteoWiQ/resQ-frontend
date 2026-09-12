export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  role?: string;
  name?: string;

  idUsuario: number;
  email: string;
  rol: string;

  [key: string]: unknown;
}