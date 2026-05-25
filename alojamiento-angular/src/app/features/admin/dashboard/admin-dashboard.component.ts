import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ReservasService } from '../../../services/reservas.service';
import { AlojamientosService } from '../../../services/alojamientos.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ReservaResponse } from '../../../core/models/reserva.model';
import { PropiedadItem } from '../../../core/models/alojamiento.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    RouterLink, CurrencyPipe, DatePipe,
    MatButtonModule, MatIconModule, MatDividerModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly resvSvc = inject(ReservasService);
  private readonly alojSvc = inject(AlojamientosService);

  readonly reservas    = signal<ReservaResponse[]>([]);
  readonly propiedades = signal<PropiedadItem[]>([]);
  readonly loading     = signal(true);

  readonly totalReservas     = computed(() => this.reservas().length);
  readonly totalPropiedades  = computed(() => this.propiedades().length);
  readonly reservasActivas   = computed(() => this.reservas().filter(r => r.estado === 'Activa').length);
  readonly reservasPendientes = computed(() => this.reservas().filter(r => r.estado === 'Pendiente').length);
  readonly totalIngresos     = computed(() => this.reservas()
    .filter(r => r.estado === 'Completada')
    .reduce((s, r) => s + r.total, 0));
  readonly recientes = computed(() =>
    [...this.reservas()]
      .sort((a, b) => b.reservaId - a.reservaId)
      .slice(0, 8));

  ngOnInit(): void {
    let pending = 2;
    const done = () => { if (--pending === 0) this.loading.set(false); };

    this.alojSvc.getAlojamientos().subscribe({
      next: r => this.propiedades.set(r.data ?? []),
      complete: done, error: done,
    });

    // Estrategia: combinar reservas del clienteId demo (1) con las
    // almacenadas en localStorage de cualquier sesión en este navegador
    const storedIds: number[] = JSON.parse(localStorage.getItem('admin_reserva_ids') || '[]');

    const base$ = this.resvSvc.getReservasByCliente(1).pipe(
      catchError(() => of({ data: [] as ReservaResponse[], success: false }))
    );

    const extra$ = storedIds.length > 0
      ? forkJoin(storedIds.map(id =>
          this.resvSvc.getReservaById(id).pipe(
            catchError(() => of({ data: null as ReservaResponse | null, success: false }))
          )
        ))
      : of([] as { data: ReservaResponse | null; success: boolean }[]);

    forkJoin([base$, extra$]).subscribe({
      next: ([baseRes, extraRes]) => {
        const baseList = baseRes.data ?? [];
        const extraList = (extraRes as { data: ReservaResponse | null }[])
          .map(r => r.data)
          .filter((r): r is ReservaResponse => r !== null);
        // Unión sin duplicados por reservaId
        const seen = new Set(baseList.map(r => r.reservaId));
        const merged = [...baseList, ...extraList.filter(r => !seen.has(r.reservaId))];
        this.reservas.set(merged);
      },
      complete: done, error: done,
    });
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      Pendiente: 'badge-warning', Confirmada: 'badge-primary',
      Activa: 'badge-primary', Completada: 'badge-success', Cancelada: 'badge-danger',
    };
    return map[estado] ?? 'badge-warning';
  }
}
