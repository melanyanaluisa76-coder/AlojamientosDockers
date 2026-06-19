import { Injectable, signal, computed } from '@angular/core';
import { AuthUser, LoginResponse } from '../models/auth.model';

const TOKEN_KEY = 'booking_token';
const USER_KEY  = 'booking_user';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly _user  = signal<AuthUser | null>(getStoredUser());

  readonly token           = this._token.asReadonly();
  readonly user            = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());
  readonly isAdmin         = computed(() => this._user()?.roles?.includes('Administrador') ?? false);
  readonly isColaborador   = computed(() => this._user()?.roles?.includes('Colaborador') ?? false);
  readonly isCliente       = computed(() => this._user()?.roles?.includes('Cliente') ?? false);
  readonly hasAdminAccess  = computed(() => this.isAdmin() || this.isColaborador());

  login(response: LoginResponse): void {
    const decoded = decodeJwtPayload(response.token);
    const user: AuthUser = {
      id:             String(decoded?.['sub'] ?? ''),
      clienteId:      response.clienteId,
      colaboradorId:  response.colaboradorId,
      nombreCompleto: response.nombreCompleto,
      email:          response.email,
      roles:          response.roles,
    };
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._token.set(response.token);
    this._user.set(user);
  }

  setClienteId(clienteId: number): void {
    const user = this._user();
    if (!user) return;
    const updated = { ...user, clienteId };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    this._user.set(updated);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
  }
}
