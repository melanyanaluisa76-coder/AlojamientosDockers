export interface ReservaResponse {
  reservaId: number;
  codigoReserva: string;
  clienteId: number;
  nombreCliente?: string;
  alojamientoId?: number;
  propiedadId?: number;
  nombrePropiedad?: string;
  fechaCheckIn: string;
  fechaCheckOut: string;
  numAdultos: number;
  numNinos: number;
  numHabitaciones: number;
  llevaMascotas?: boolean;
  estado: string;
  subTotal: number;
  total: number;
  descuento?: number;
  nochesTotal?: number;
}

export interface CrearReservaRequest {
  clienteId: number;
  propiedadId?: number;
  alojamientoId?: number;
  habitacionIds?: number[];
  habitaciones?: DetalleHabitacionRequest[];
  fechaCheckIn: string;
  fechaCheckOut: string;
  numAdultos: number;
  numNinos: number;
  llevaMascotas: boolean;
  monedaId?: number;
  metodoPagoId?: number;
  codigoDescuento?: string;
}

export interface DetalleHabitacionRequest {
  habitacionId: number;
  precioPorNoche: number;
  numNoches: number;
}

export interface ActualizarEstadoReservaRequest {
  estado: string;
}
