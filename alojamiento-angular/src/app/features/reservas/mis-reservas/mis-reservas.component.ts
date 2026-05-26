import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ReservasService } from '../../../services/reservas.service';
import { AuthStore } from '../../../core/store/auth.store';
import { NotificationService } from '../../../core/services/notification.service';
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
  private readonly notify    = inject(NotificationService);

  readonly reservas      = signal<ReservaResponse[]>([]);
  readonly loading       = signal(true);
  readonly cancellingId  = signal<number | null>(null);
  readonly cancelling    = signal(false);

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

  puedeCancel(r: ReservaResponse): boolean {
    if (localStorage.getItem(`reserva_paid_${r.reservaId}`)) return false;
    return ['Pendiente', 'Confirmada'].includes(r.estado);
  }

  solicitarCancelacion(id: number): void {
    this.cancellingId.set(id);
  }

  abortarCancelacion(): void {
    this.cancellingId.set(null);
  }

  confirmarCancelacion(r: ReservaResponse): void {
    this.cancelling.set(true);
    this.svc.actualizarEstado(r.reservaId, { estado: 'Cancelada' }).subscribe({
      next: () => {
        // Actualizar estado en la lista local sin recargar
        this.reservas.update(list =>
          list.map(x => x.reservaId === r.reservaId ? { ...x, estado: 'Cancelada' } : x)
        );
        // Limpiar slots del localStorage para liberar esas fechas
        type BookedSlot = { habitacionId: number; checkIn: string; checkOut: string };
        const habitacionIds = (r.detallesHabitacion ?? []).map(d => d.habitacionId);
        if (habitacionIds.length > 0) {
          const slots: BookedSlot[] = JSON.parse(localStorage.getItem('booked_slots') || '[]');
          const filtered = slots.filter(s =>
            !(habitacionIds.includes(s.habitacionId) &&
              s.checkIn === r.fechaCheckIn && s.checkOut === r.fechaCheckOut)
          );
          localStorage.setItem('booked_slots', JSON.stringify(filtered));
        }
        localStorage.removeItem(`reserva_paid_${r.reservaId}`);
        this.cancellingId.set(null);
        this.notify.success('Reserva cancelada correctamente.');
      },
      error: () => {
        this.notify.error('No se pudo cancelar la reserva. Intenta de nuevo.');
        this.cancelling.set(false);
      },
      complete: () => this.cancelling.set(false),
    });
  }
}
