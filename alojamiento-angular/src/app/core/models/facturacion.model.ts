export interface CrearDetalleFacturaRequest {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export interface CrearFacturaRequest {
  reservaId: number;
  metodoPagoId?: number | null;
  monto: number;
  fechaPago?: string | null;
  detalles: CrearDetalleFacturaRequest[];
}

export interface FacturaResponse {
  facturaId: number;
  reservaId: number;
  codigoReserva?: string;
  monto: number;
  moneda?: string;
  metodoPago?: string;
  estado: string;
  referenciaPago?: string | null;
  fechaPago?: string | null;
  fechaCreacion?: string;
}

export interface MetodoPagoItem {
  metodoPagoId: number;
  tipo: string;
}
