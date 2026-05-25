import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../core/models/api-response.model';
import {
  ReservaResponse,
  CrearReservaRequest,
  ActualizarEstadoReservaRequest,
} from '../core/models/reserva.model';

@Injectable({ providedIn: 'root' })
export class ReservasService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getReservaById(id: number): Observable<ApiResponse<ReservaResponse>> {
    return this.http.get<ApiResponse<ReservaResponse>>(`${this.base}/booking/${id}`);
  }

  getReservasByCliente(clienteId: number): Observable<ApiResponse<ReservaResponse[]>> {
    return this.http.get<ApiResponse<ReservaResponse[]>>(`${this.base}/booking/cliente/${clienteId}`);
  }

  getResumenByCliente(clienteId: number): Observable<ApiResponse<ReservaResponse[]>> {
    return this.http.get<ApiResponse<ReservaResponse[]>>(`${this.base}/booking/resumen/cliente/${clienteId}`);
  }

  crearReserva(req: CrearReservaRequest): Observable<ApiResponse<ReservaResponse>> {
    return this.http.post<ApiResponse<ReservaResponse>>(`${this.base}/booking`, req);
  }

  actualizarEstado(id: number, req: ActualizarEstadoReservaRequest): Observable<void> {
    return this.http.patch<void>(`${this.base}/booking/${id}/estado`, req);
  }
}
