import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../core/models/api-response.model';
import { LoginRequest, LoginResponse, RegisterRequest, UsuarioAdmin, Rol } from '../core/models/auth.model';
import { ColaboradorItem, CrearColaboradorRequest } from '../core/models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  // ── Auth ─────────────────────────────────────────────────────────────────
  login(req: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.base}/authanaluisa/login`, req);
  }

  register(req: RegisterRequest): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/clientesanaluisa`, req);
  }

  // ── Gestión de usuarios (Admin) ──────────────────────────────────────────
  getUsuarios(): Observable<ApiResponse<UsuarioAdmin[]>> {
    return this.http.get<ApiResponse<UsuarioAdmin[]>>(`${this.base}/authanaluisa/usuarios`);
  }

  getRoles(): Observable<ApiResponse<Rol[]>> {
    return this.http.get<ApiResponse<Rol[]>>(`${this.base}/authanaluisa/roles`);
  }

  cambiarRol(userId: number, rolId: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/authanaluisa/usuarios/${userId}/rol`, { rolId });
  }

  cambiarEstadoUsuario(userId: number, activo: boolean): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/authanaluisa/usuarios/${userId}/estado`, { activo });
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
