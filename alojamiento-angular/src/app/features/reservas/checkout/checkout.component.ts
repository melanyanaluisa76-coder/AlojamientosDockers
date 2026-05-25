import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { ReservasService } from '../../../services/reservas.service';
import { FacturacionService } from '../../../services/facturacion.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ReservaResponse } from '../../../core/models/reserva.model';
import { MetodoPagoItem } from '../../../core/models/facturacion.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule, DatePipe, CurrencyPipe,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDividerModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly fb         = inject(FormBuilder);
  private readonly resvSvc    = inject(ReservasService);
  private readonly factSvc    = inject(FacturacionService);
  private readonly notify     = inject(NotificationService);

  readonly reserva      = signal<ReservaResponse | null>(null);
  readonly metodosPago  = signal<MetodoPagoItem[]>([]);
  readonly loading      = signal(true);
  readonly submitting   = signal(false);

  readonly payForm = this.fb.group({
    metodoPagoId: [null as number | null, Validators.required],
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.factSvc.getMetodosPago().subscribe({
      next: r => this.metodosPago.set(r.data ?? []),
    });

    // Guardia frontend: si ya se pagó en esta sesión, ir directo a factura
    if (localStorage.getItem(`reserva_paid_${id}`)) {
      this.router.navigate(['/factura', id]);
      return;
    }

    this.resvSvc.getReservaById(id).subscribe({
      next: r => {
        this.reserva.set(r.data);
        if (r.data?.estado === 'Completada' || localStorage.getItem(`reserva_paid_${r.data?.reservaId}`)) {
          this.router.navigate(['/factura', id]);
        }
      },
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  pagar(): void {
    if (this.payForm.invalid) {
      this.payForm.markAllAsTouched();
      return;
    }
    const r = this.reserva();
    if (!r) return;

    const raw = this.payForm.getRawValue();
    this.submitting.set(true);

    this.factSvc.crearFactura({
      reservaId:    r.reservaId,
      metodoPagoId: raw.metodoPagoId,
      monto:        r.total,
      detalles: [{
        descripcion:    `Pago reserva ${r.codigoReserva}`,
        cantidad:        1,
        precioUnitario:  r.total,
      }],
    }).subscribe({
      next: () => {
        // Marcar pagada en localStorage para evitar pagos duplicados
        localStorage.setItem(`reserva_paid_${r.reservaId}`, '1');
        // Intentar actualizar estado en backend (puede ser stub, pero si funciona, persiste)
        this.resvSvc.actualizarEstado(r.reservaId, { estado: 'Completada' }).subscribe();
        this.notify.success('¡Pago procesado exitosamente!');
        this.router.navigate(['/factura', r.reservaId]);
      },
      error: () => this.submitting.set(false),
      complete: () => this.submitting.set(false),
    });
  }
}
