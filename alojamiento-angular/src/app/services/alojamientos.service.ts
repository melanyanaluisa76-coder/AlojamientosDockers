import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../core/models/api-response.model';
import {
  PropiedadItem, HabitacionItem,
  CrearAlojamientoRequest, CrearHabitacionRequest,
} from '../core/models/alojamiento.model';

@Injectable({ providedIn: 'root' })
export class AlojamientosService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  // ── Alojamientos ─────────────────────────────────────────────────────────
  getAlojamientos(): Observable<ApiResponse<PropiedadItem[]>> {
    return this.http.get<ApiResponse<PropiedadItem[]>>(`${this.base}/alojamientos`);
  }

  getAlojamientoById(id: number): Observable<ApiResponse<PropiedadItem>> {
    return this.http.get<ApiResponse<PropiedadItem>>(`${this.base}/alojamientos/${id}`);
  }

  crearAlojamiento(req: CrearAlojamientoRequest): Observable<ApiResponse<PropiedadItem>> {
    return this.http.post<ApiResponse<PropiedadItem>>(`${this.base}/alojamientos`, req);
  }

  actualizarAlojamiento(id: number, req: Partial<CrearAlojamientoRequest>): Observable<void> {
    return this.http.put<void>(`${this.base}/alojamientos/${id}`, req);
  }

  eliminarAlojamiento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/alojamientos/${id}`);
  }

  // ── Habitaciones ─────────────────────────────────────────────────────────
  getHabitacionesByAlojamiento(alojamientoId: number): Observable<ApiResponse<HabitacionItem[]>> {
    return this.http.get<ApiResponse<HabitacionItem[]>>(
      `${this.base}/habitaciones/alojamiento/${alojamientoId}`,
    );
  }

  getHabitacionById(id: number): Observable<ApiResponse<HabitacionItem>> {
    return this.http.get<ApiResponse<HabitacionItem>>(`${this.base}/habitaciones/${id}`);
  }

  crearHabitacion(req: CrearHabitacionRequest): Observable<ApiResponse<HabitacionItem>> {
    return this.http.post<ApiResponse<HabitacionItem>>(`${this.base}/habitaciones`, req);
  }

  eliminarHabitacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/habitaciones/${id}`);
  }

  // ── Calendario ───────────────────────────────────────────────────────────
  getCalendario(habitacionId: number, mes: number, anio: number): Observable<ApiResponse<unknown[]>> {
    const params = new HttpParams().set('mes', mes).set('anio', anio);
    return this.http.get<ApiResponse<unknown[]>>(
      `${this.base}/calendario/habitacion/${habitacionId}`,
      { params },
    );
  }
}
