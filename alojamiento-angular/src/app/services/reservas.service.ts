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

  getReservaByCodigo(codigo: string): Observable<ApiResponse<ReservaResponse>> {
    return this.http.get<ApiResponse<ReservaResponse>>(`${this.base}/reservas/${codigo}`);
  }

  getReservasByCliente(clienteId: number): Observable<ApiResponse<ReservaResponse[]>> {
    return this.http.get<ApiResponse<ReservaResponse[]>>(`${this.base}/reservas/cliente/${clienteId}`);
  }

  getTodasLasReservas(): Observable<ApiResponse<ReservaResponse[]>> {
    return this.http.get<ApiResponse<ReservaResponse[]>>(`${this.base}/reservas/todas`);
  }

  crearReserva(req: CrearReservaRequest): Observable<ApiResponse<ReservaResponse>> {
    return this.http.post<ApiResponse<ReservaResponse>>(`${this.base}/reservas`, req);
  }

  actualizarEstado(id: number, req: ActualizarEstadoReservaRequest): Observable<void> {
    return this.http.patch<void>(`${this.base}/reservas/${id}/estado`, req);
  }
}
