import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
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

    this.resvSvc.getResumenByCliente(0).subscribe({
      next: r => this.reservas.set(r.data ?? []),
      complete: done, error: done,
    });
    this.alojSvc.getAlojamientos().subscribe({
      next: r => this.propiedades.set(r.data ?? []),
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
