import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { ReservasService } from '../../../services/reservas.service';
import { FacturacionService } from '../../../services/facturacion.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ReservaResponse } from '../../../core/models/reserva.model';
import { TipoPago } from '../../../core/models/facturacion.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule, DatePipe, CurrencyPipe,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatRadioModule, MatDividerModule,
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

  readonly reserva    = signal<ReservaResponse | null>(null);
  readonly loading    = signal(true);
  readonly submitting = signal(false);

  readonly payForm = this.fb.group({
    tipoPago:       ['Tarjeta' as TipoPago, Validators.required],
    referenciaPago: ['', Validators.required],
  });

  get tipoPago(): TipoPago {
    return this.payForm.get('tipoPago')!.value as TipoPago;
  }

  ngOnInit(): void {
    const codigo = this.route.snapshot.paramMap.get('codigo')!;
    this.resvSvc.getReservaByCodigo(codigo).subscribe({
      next: r => {
        this.reserva.set(r.datos);
        if (r.datos?.estado === 'Completada') {
          this.router.navigate(['/factura', codigo]);
        }
      },
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });

    this.payForm.get('tipoPago')!.valueChanges.subscribe(tipo => {
      const ref = this.payForm.get('referenciaPago')!;
      if (tipo === 'EnSitio') {
        ref.setValue('EN_SITIO');
        ref.disable();
      } else {
        ref.setValue('');
        ref.enable();
        ref.setValidators([Validators.required]);
        ref.updateValueAndValidity();
      }
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

    this.factSvc.procesarPago({
      reservaId:      r.reservaId,
      monto:          r.total,
      monedaId:       1,
      tipoPago:       raw.tipoPago as TipoPago,
      referenciaPago: raw.referenciaPago ?? '',
    }).subscribe({
      next: () => {
        this.notify.success('¡Pago procesado exitosamente!');
        this.router.navigate(['/factura', r.codigoReserva]);
      },
      error: () => this.submitting.set(false),
      complete: () => this.submitting.set(false),
    });
  }
}
