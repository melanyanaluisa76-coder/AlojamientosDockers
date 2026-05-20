export type TipoPago = 'Tarjeta' | 'EnSitio';

export interface PagoRequest {
  reservaId: number;
  monto: number;
  monedaId: number;
  tipoPago: TipoPago;
  referenciaPago: string;
}

export interface PagoResponse {
  pagoId: number;
  reservaId: number;
  monto: number;
  tipoPago: string;
  referenciaPago?: string;
  referenciaExterna?: string;
  fechaPago: string;
}

export interface FacturaResponse {
  facturaId: number;
  reservaId: number;
  codigoReserva?: string;
  total: number;
  estado: string;
  fechaEmision: string;
}
