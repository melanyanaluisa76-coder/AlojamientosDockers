import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { FacturacionService } from '../../../services/facturacion.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { FacturaResponse } from '../../../core/models/facturacion.model';

const ESTADOS_FACTURA = ['Pendiente', 'Pagado', 'Rechazado'];

@Component({
  selector: 'app-admin-facturas',
  standalone: true,
  imports: [
    ReactiveFormsModule, CurrencyPipe, DatePipe,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatTooltipModule, MatDividerModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './admin-facturas.component.html',
  styleUrl: './admin-facturas.component.scss',
})
export class AdminFacturasComponent implements OnInit {
  private readonly svc    = inject(FacturacionService);
  private readonly notify = inject(NotificationService);
  private readonly fb     = inject(FormBuilder);

  readonly facturas  = signal<FacturaResponse[]>([]);
  readonly loading   = signal(true);
  readonly error     = signal(false);
  readonly updating  = signal<number | null>(null);

  readonly filterForm = this.fb.group({
    search: [''],
    estado: [''],
  });

  readonly estadosOptions = ESTADOS_FACTURA;

  readonly filtered = computed(() => {
    const { search, estado } = this.filterForm.getRawValue();
    return this.facturas().filter(f => {
      const matchSearch = !search ||
        String(f.facturaId).includes(search) ||
        String(f.reservaId).includes(search) ||
        f.codigoReserva?.toLowerCase().includes(search.toLowerCase());
      const matchEstado = !estado || f.estado === estado;
      return matchSearch && matchEstado;
    });
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(false);
    this.svc.getTodasFacturas().subscribe({
      next: r => this.facturas.set(r.data ?? []),
      error: () => { this.loading.set(false); this.error.set(true); },
      complete: () => this.loading.set(false),
    });
  }

  aprobar(id: number): void {
    this.updating.set(id);
    this.svc.aprobarFactura(id).subscribe({
      next: () => {
        this.facturas.update(list =>
          list.map(f => f.facturaId === id ? { ...f, estado: 'Pagado' } : f),
        );
        this.notify.success('Factura aprobada. Reserva confirmada automáticamente.');
      },
      error: () => this.notify.error('No se pudo aprobar la factura.'),
      complete: () => this.updating.set(null),
    });
  }

  rechazar(id: number): void {
    this.updating.set(id);
    this.svc.rechazarFactura(id).subscribe({
      next: () => {
        this.facturas.update(list =>
          list.map(f => f.facturaId === id ? { ...f, estado: 'Rechazado' } : f),
        );
        this.notify.warning('Factura rechazada.');
      },
      error: () => this.notify.error('No se pudo rechazar la factura.'),
      complete: () => this.updating.set(null),
    });
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      Pendiente: 'badge-warning',
      Pagado: 'badge-success',
      Rechazado: 'badge-danger',
    };
    return map[estado] ?? 'badge-warning';
  }
}
