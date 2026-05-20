import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, PaginatedData } from '../core/models/api-response.model';
import {
  PropiedadItem, HabitacionItem,
  CrearPropiedadRequest, CrearHabitacionRequest,
  Ciudad, TipoAlojamiento, BuscarPropiedadesParams,
} from '../core/models/alojamiento.model';

@Injectable({ providedIn: 'root' })
export class AlojamientosService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  // ── Maestros ─────────────────────────────────────────────────────────────
  getCiudades(): Observable<ApiResponse<Ciudad[]>> {
    return this.http.get<ApiResponse<Ciudad[]>>(`${this.base}/maestros/ciudades`);
  }

  getTiposAlojamiento(): Observable<ApiResponse<TipoAlojamiento[]>> {
    return this.http.get<ApiResponse<TipoAlojamiento[]>>(`${this.base}/maestros/tipos-alojamiento`);
  }

  // ── Propiedades ──────────────────────────────────────────────────────────
  buscarPropiedades(params?: BuscarPropiedadesParams): Observable<ApiResponse<PaginatedData<PropiedadItem>>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http.get<ApiResponse<PaginatedData<PropiedadItem>>>(
      `${this.base}/propiedades/buscar`,
      { params: httpParams },
    );
  }

  getPropiedadById(id: number): Observable<ApiResponse<PropiedadItem>> {
    return this.http.get<ApiResponse<PropiedadItem>>(`${this.base}/propiedades/${id}`);
  }

  getPropiedadesByColaborador(colaboradorId: number): Observable<ApiResponse<PropiedadItem[]>> {
    return this.http.get<ApiResponse<PropiedadItem[]>>(`${this.base}/propiedades/colaborador/${colaboradorId}`);
  }

  crearPropiedad(req: CrearPropiedadRequest): Observable<ApiResponse<PropiedadItem>> {
    return this.http.post<ApiResponse<PropiedadItem>>(`${this.base}/propiedades`, req);
  }

  cambiarEstadoPropiedad(id: number, nuevoEstado: string): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/propiedades/${id}/estado`, { nuevoEstado });
  }

  // ── Habitaciones ─────────────────────────────────────────────────────────
  getHabitacionesByPropiedad(propiedadId: number): Observable<ApiResponse<HabitacionItem[]>> {
    return this.http.get<ApiResponse<HabitacionItem[]>>(`${this.base}/habitaciones/por-propiedad/${propiedadId}`);
  }

  crearHabitacion(req: CrearHabitacionRequest): Observable<ApiResponse<HabitacionItem>> {
    return this.http.post<ApiResponse<HabitacionItem>>(`${this.base}/habitaciones`, req);
  }

  eliminarHabitacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/habitaciones/${id}`);
  }
}
