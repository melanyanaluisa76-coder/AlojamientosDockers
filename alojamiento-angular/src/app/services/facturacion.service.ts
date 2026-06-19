import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../core/models/api-response.model';
import { CrearFacturaRequest, FacturaResponse, MetodoPagoItem } from '../core/models/facturacion.model';

@Injectable({ providedIn: 'root' })
export class FacturacionService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  crearFactura(req: CrearFacturaRequest): Observable<ApiResponse<FacturaResponse>> {
    return this.http.post<ApiResponse<FacturaResponse>>(`${this.base}/facturas`, req);
  }

  getFacturaByReserva(reservaId: number): Observable<ApiResponse<FacturaResponse>> {
    return this.http.get<ApiResponse<FacturaResponse>>(`${this.base}/facturas/reserva/${reservaId}`);
  }

  getResumenFacturaByReserva(reservaId: number): Observable<ApiResponse<FacturaResponse>> {
    return this.http.get<ApiResponse<FacturaResponse>>(`${this.base}/facturas/resumen/reserva/${reservaId}`);
  }

  getMetodosPago(): Observable<ApiResponse<MetodoPagoItem[]>> {
    return this.http.get<ApiResponse<MetodoPagoItem[]>>(`${this.base}/metodospago`);
  }

  getTodasFacturas(): Observable<ApiResponse<FacturaResponse[]>> {
    return this.http.get<ApiResponse<FacturaResponse[]>>(`${this.base}/facturas`);
  }

  aprobarFactura(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/facturas/${id}/aprobar`, {});
  }

  rechazarFactura(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/facturas/${id}/rechazar`, {});
  }
}
