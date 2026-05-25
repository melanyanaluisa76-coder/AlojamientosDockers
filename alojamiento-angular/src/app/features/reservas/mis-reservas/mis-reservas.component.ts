import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ReservasService } from '../../../services/reservas.service';
import { AuthStore } from '../../../core/store/auth.store';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ReservaResponse } from '../../../core/models/reserva.model';

@Component({
  selector: 'app-mis-reservas',
  standalone: true,
  imports: [
    RouterLink, DatePipe, CurrencyPipe, DecimalPipe,
    MatButtonModule, MatIconModule, MatDividerModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './mis-reservas.component.html',
  styleUrl: './mis-reservas.component.scss',
})
export class MisReservasComponent implements OnInit {
  private readonly svc       = inject(ReservasService);
  private readonly authStore = inject(AuthStore);

  readonly reservas = signal<ReservaResponse[]>([]);
  readonly loading  = signal(true);

  ngOnInit(): void {
    const clienteId = this.authStore.user()?.clienteId;
    if (!clienteId) { this.loading.set(false); return; }

    this.svc.getReservasByCliente(clienteId).subscribe({
      next: r => this.reservas.set(r.data ?? []),
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      Pendiente:  'badge-warning',
      Confirmada: 'badge-primary',
      Activa:     'badge-primary',
      Completada: 'badge-success',
      Cancelada:  'badge-danger',
    };
    return map[estado] ?? 'badge-warning';
  }

  isPendingPayment(r: ReservaResponse): boolean {
    if (localStorage.getItem(`reserva_paid_${r.reservaId}`)) return false;
    return ['Pendiente', 'Confirmada'].includes(r.estado);
  }

  hasInvoice(r: ReservaResponse): boolean {
    if (localStorage.getItem(`reserva_paid_${r.reservaId}`)) return true;
    return r.estado === 'Completada';
  }
}
