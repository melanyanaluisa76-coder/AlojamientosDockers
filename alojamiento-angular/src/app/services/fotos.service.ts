import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../core/models/api-response.model';
import { FotoItem } from '../core/models/alojamiento.model';

export interface AgregarFotoRequest {
  alojamientoId: number;
  url: string;
  orden?: number;
  descripcion?: string;
}

@Injectable({ providedIn: 'root' })
export class FotosService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getFotosByAlojamiento(alojamientoId: number): Observable<ApiResponse<FotoItem[]>> {
    return this.http.get<ApiResponse<FotoItem[]>>(`${this.base}/fotos/alojamiento/${alojamientoId}`);
  }

  agregarFoto(req: AgregarFotoRequest): Observable<ApiResponse<FotoItem>> {
    return this.http.post<ApiResponse<FotoItem>>(`${this.base}/fotos`, req);
  }

  eliminarFoto(fotoId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/fotos/${fotoId}`);
  }
}
