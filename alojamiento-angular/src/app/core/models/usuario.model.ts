export interface ColaboradorItem {
  colaboradorId: number;
  usuarioId: number;
  nombreEmpresa?: string;
  nombreCompleto?: string;
  email?: string;
  telefono?: string;
  totalPropiedades?: number;
}

export interface CrearColaboradorRequest {
  usuarioId: number;
  nombreEmpresa: string;
  telefono: string;
}

export interface ClienteItem {
  clienteId: number;
  usuarioId?: number;
  cedula?: string;
  email: string;
  telefono?: string;
  domicilio?: string;
  totalReservas?: number;
}
