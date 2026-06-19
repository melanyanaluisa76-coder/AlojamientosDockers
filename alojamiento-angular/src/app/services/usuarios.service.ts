import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../core/models/api-response.model';
import { LoginRequest, LoginResponse, RegisterRequest, UsuarioAdmin, Rol } from '../core/models/auth.model';
import { ColaboradorItem, CrearColaboradorRequest } from '../core/models/usuario.model';

// Payload base64 para tokens demo: {"sub":"1"} y {"sub":"999"}
const DEMO_HEADER = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
const GHOST_LOGINS: Record<string, LoginResponse> = {
  'cliente@demo.com:Demo12345!': {
    token: `${DEMO_HEADER}.eyJzdWIiOiIxIn0=.demo`,
    clienteId: 1,
    colaboradorId: null,
    nombreCompleto: 'Cliente Demo',
    email: 'cliente@demo.com',
    roles: ['Cliente'],
  },
  'admin@demo.com:Admin12345!': {
    token: `${DEMO_HEADER}.eyJzdWIiOiI5OTkifQ==.demo`,
    clienteId: null,
    colaboradorId: 1,
    nombreCompleto: 'Administrador Demo',
    email: 'admin@demo.com',
    roles: ['Administrador'],
  },
};

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  // ── Auth ─────────────────────────────────────────────────────────────────
  login(req: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    const ghost = GHOST_LOGINS[`${req.email}:${req.password}`];
    if (ghost) {
      return of({ data: ghost, success: true });
    }
    return this.http.post<ApiResponse<LoginResponse>>(`${this.base}/auth/login`, req);
  }

  register(req: RegisterRequest): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/clientes/registrar`, req);
  }

  getClientes(): Observable<ApiResponse<{ clienteId: number; email: string; nombreCompleto: string }[]>> {
    return this.http.get<ApiResponse<{ clienteId: number; email: string; nombreCompleto: string }[]>>(`${this.base}/clientes`);
  }

  // ── Gestión de usuarios (Admin) ──────────────────────────────────────────
  getUsuarios(): Observable<ApiResponse<UsuarioAdmin[]>> {
    return this.http.get<ApiResponse<UsuarioAdmin[]>>(`${this.base}/auth/usuarios`);
  }

  getRoles(): Observable<ApiResponse<Rol[]>> {
    return this.http.get<ApiResponse<Rol[]>>(`${this.base}/auth/roles`);
  }

  cambiarRol(userId: number, rolId: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/auth/usuarios/${userId}/rol`, { rolId });
  }

  cambiarEstadoUsuario(userId: number, activo: boolean): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/auth/usuarios/${userId}/estado`, { activo });
  }

  // ── Colaboradores ────────────────────────────────────────────────────────
  getColaboradores(): Observable<ApiResponse<ColaboradorItem[]>> {
    return this.http.get<ApiResponse<ColaboradorItem[]>>(`${this.base}/colaboradoresanaluisa`);
  }

  crearColaborador(req: CrearColaboradorRequest): Observable<ApiResponse<ColaboradorItem>> {
    return this.http.post<ApiResponse<ColaboradorItem>>(`${this.base}/colaboradoresanaluisa`, req);
  }

  eliminarColaborador(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/colaboradoresanaluisa/${id}`);
  }
}
