import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReservasService } from '../../../services/reservas.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ReservaResponse } from '../../../core/models/reserva.model';

const ESTADOS = ['Pendiente', 'Confirmada', 'Activa', 'Completada', 'Cancelada'];

@Component({
  selector: 'app-admin-reservas',
  standalone: true,
  imports: [
    ReactiveFormsModule, CurrencyPipe, DatePipe,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatMenuModule, MatDividerModule, MatTooltipModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './admin-reservas.component.html',
  styleUrl: './admin-reservas.component.scss',
})
export class AdminReservasComponent implements OnInit {
  private readonly svc    = inject(ReservasService);
  private readonly notify = inject(NotificationService);
  private readonly fb     = inject(FormBuilder);

  readonly reservas = signal<ReservaResponse[]>([]);
  readonly loading  = signal(true);
  readonly updating = signal<number | null>(null);

  readonly filterForm = this.fb.group({
    search: [''],
    estado: [''],
  });

  readonly estadosOptions = ESTADOS;

  readonly filtered = computed(() => {
    const { search, estado } = this.filterForm.getRawValue();
    return this.reservas().filter(r => {
      const matchSearch = !search || r.codigoReserva?.toLowerCase().includes(search.toLowerCase()) || r.nombreCliente?.toLowerCase().includes(search.toLowerCase());
      const matchEstado = !estado || r.estado === estado;
      return matchSearch && matchEstado;
    });
  });

  ngOnInit(): void {
    this.cargar();
    this.filterForm.valueChanges.subscribe(() => {});
  }

  cargar(): void {
    this.loading.set(true);
    this.svc.getTodasLasReservas().subscribe({
      next: r => this.reservas.set(r.datos ?? []),
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  cambiarEstado(id: number, estado: string): void {
    this.updating.set(id);
    this.svc.actualizarEstado(id, { estado }).subscribe({
      next: () => {
        this.reservas.update(list =>
          list.map(r => r.reservaId === id ? { ...r, estado } : r),
        );
        this.notify.success(`Estado actualizado a "${estado}".`);
      },
      error: () => this.notify.error('No se pudo actualizar el estado.'),
      complete: () => this.updating.set(null),
    });
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      Pendiente: 'badge-warning', Confirmada: 'badge-primary',
      Activa: 'badge-primary', Completada: 'badge-success', Cancelada: 'badge-danger',
    };
    return map[estado] ?? 'badge-warning';
  }

  nextEstados(current: string): string[] {
    return ESTADOS.filter(e => e !== current);
  }
}
