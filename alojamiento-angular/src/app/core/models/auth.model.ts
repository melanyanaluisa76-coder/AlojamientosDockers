export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  clienteId: number | null;
  colaboradorId: number | null;
  nombreCompleto: string;
  email: string;
  roles: string[];
}

export interface AuthUser {
  id: string;
  clienteId: number | null;
  colaboradorId: number | null;
  nombreCompleto: string;
  email: string;
  roles: string[];
}

export interface RegisterRequest {
  nombreCompleto: string;
  email: string;
  password: string;
  telefono?: string | null;
}

export interface UsuarioAdmin {
  usuarioId: number;
  nombreCompleto: string;
  email: string;
  rolId: number;
  rolNombre: string;
  estado: boolean;
  ultimoAcceso?: string;
}

export interface Rol {
  rolId: number;
  nombre: string;
}
