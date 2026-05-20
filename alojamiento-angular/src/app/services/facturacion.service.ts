import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../core/models/api-response.model';
import { PagoRequest, PagoResponse, FacturaResponse } from '../core/models/facturacion.model';

@Injectable({ providedIn: 'root' })
export class FacturacionService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  procesarPago(req: PagoRequest): Observable<ApiResponse<PagoResponse>> {
    return this.http.post<ApiResponse<PagoResponse>>(`${this.base}/pagos`, req);
  }

  getPagosByReserva(reservaId: number): Observable<ApiResponse<PagoResponse[]>> {
    return this.http.get<ApiResponse<PagoResponse[]>>(`${this.base}/pagos/por-reserva/${reservaId}`);
  }

  getFacturaByReserva(reservaId: number): Observable<ApiResponse<FacturaResponse>> {
    return this.http.get<ApiResponse<FacturaResponse>>(`${this.base}/facturas/reserva/${reservaId}`);
  }
}
