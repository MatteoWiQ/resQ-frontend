import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { LoginRequest, LoginResponse } from '../../shared/models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly loginEndpoint = '/api/login';
  private readonly registerEndpoint = '/api/usuarios';

  constructor(private readonly http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.loginEndpoint, credentials);
  }

  register(usuario: {
    nombre: string;
    email: string;
    password: string;
    telefono: string;
    rol: string;
  }): Observable<any> {
    return this.http.post(this.registerEndpoint, usuario);
  }
}