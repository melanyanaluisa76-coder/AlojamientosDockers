import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ReservasService } from '../../../services/reservas.service';
import { FacturacionService } from '../../../services/facturacion.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ReservaResponse } from '../../../core/models/reserva.model';
import { FacturaResponse, PagoResponse } from '../../../core/models/facturacion.model';

@Component({
  selector: 'app-factura',
  standalone: true,
  imports: [
    RouterLink, DatePipe, CurrencyPipe,
    MatButtonModule, MatIconModule, MatDividerModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './factura.component.html',
  styleUrl: './factura.component.scss',
})
export class FacturaComponent implements OnInit {
  private readonly route   = inject(ActivatedRoute);
  private readonly resvSvc = inject(ReservasService);
  private readonly factSvc = inject(FacturacionService);

  readonly reserva = signal<ReservaResponse | null>(null);
  readonly factura = signal<FacturaResponse | null>(null);
  readonly pagos   = signal<PagoResponse[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    const codigo = this.route.snapshot.paramMap.get('codigo')!;
    this.resvSvc.getReservaByCodigo(codigo).subscribe({
      next: r => {
        this.reserva.set(r.datos);
        const id = r.datos?.reservaId;
        if (!id) { this.loading.set(false); return; }

        let pending = 2;
        const done = () => { if (--pending === 0) this.loading.set(false); };

        this.factSvc.getFacturaByReserva(id).subscribe({
          next: f => this.factura.set(f.datos),
          complete: done, error: done,
        });
        this.factSvc.getPagosByReserva(id).subscribe({
          next: p => this.pagos.set(p.datos ?? []),
          complete: done, error: done,
        });
      },
      error: () => this.loading.set(false),
    });
  }

  imprimir(): void { window.print(); }
}
