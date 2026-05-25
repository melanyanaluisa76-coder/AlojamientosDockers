export interface DetalleHabitacionDto {
  detalleId?: number;
  habitacionId: number;
  precioPorNoche: number;
  numNoches: number;
  subTotalHabitacion?: number;
}

export interface ReservaResponse {
  reservaId: number;
  codigoReserva: string;
  clienteId: number;
  alojamientoId?: number;
  nombreCliente?: string;
  fechaCheckIn: string;
  fechaCheckOut: string;
  numAdultos: number;
  numNinos: number;
  llevaMascotas?: boolean;
  numHabitaciones?: number;
  subTotal?: number;
  total: number;
  moneda?: string;
  estado: string;
  fechaCreacion?: string;
  detallesHabitacion?: DetalleHabitacionDto[];
  codigoDescuentoAplicado?: string | null;
  porcentajeDescuento?: number | null;
}

export interface CrearReservaRequest {
  clienteId: number;
  alojamientoId: number;
  fechaCheckIn: string;
  fechaCheckOut: string;
  numAdultos: number;
  numNinos: number;
  llevaMascotas: boolean;
  codigoDescuento?: string | null;
  habitaciones: DetalleHabitacionRequest[];
}

export interface DetalleHabitacionRequest {
  habitacionId: number;
  precioPorNoche: number;
  numNoches: number;
}

export interface ActualizarEstadoReservaRequest {
  estado: string;
}
