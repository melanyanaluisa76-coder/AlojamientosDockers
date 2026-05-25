import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AlojamientosService } from '../../../services/alojamientos.service';
import { ReservasService } from '../../../services/reservas.service';
import { AuthStore } from '../../../core/store/auth.store';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PropiedadItem, HabitacionItem } from '../../../core/models/alojamiento.model';

@Component({
  selector: 'app-propiedad-detalle',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule, DecimalPipe, CurrencyPipe,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatCheckboxModule, MatDividerModule, MatTooltipModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './propiedad-detalle.component.html',
  styleUrl: './propiedad-detalle.component.scss',
})
export class PropiedadDetalleComponent implements OnInit {
  private readonly route    = inject(ActivatedRoute);
  private readonly router   = inject(Router);
  private readonly fb       = inject(FormBuilder);
  private readonly alojSvc  = inject(AlojamientosService);
  private readonly resvSvc  = inject(ReservasService);
  readonly authStore         = inject(AuthStore);
  private readonly notify   = inject(NotificationService);

  readonly propiedad   = signal<PropiedadItem | null>(null);
  readonly habitaciones = signal<HabitacionItem[]>([]);
  readonly loading      = signal(true);
  readonly submitting   = signal(false);
  readonly selectedRooms = signal<Set<number>>(new Set());

  readonly bookingForm = this.fb.group({
    fechaCheckIn:  ['', Validators.required],
    fechaCheckOut: ['', Validators.required],
    numAdultos:    [1, [Validators.required, Validators.min(1), Validators.max(20)]],
    numNinos:      [0, [Validators.min(0), Validators.max(20)]],
    llevaMascotas: [false],
  });

  private readonly formValues = toSignal(this.bookingForm.valueChanges, {
    initialValue: this.bookingForm.getRawValue(),
  });

  readonly nightCount = computed(() => {
    const v = this.formValues();
    if (!v.fechaCheckIn || !v.fechaCheckOut) return 0;
    const diff = new Date(v.fechaCheckOut).getTime() - new Date(v.fechaCheckIn).getTime();
    return Math.max(0, Math.ceil(diff / 86_400_000));
  });

  readonly subtotal = computed(() => {
    const nights = this.nightCount();
    if (nights === 0) return 0;
    return this.habitaciones()
      .filter(h => this.selectedRooms().has(h.habitacionId))
      .reduce((acc, h) => acc + (h.precioNoche ?? 0) * nights, 0);
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.alojSvc.getAlojamientoById(id).subscribe({
      next: r => this.propiedad.set(r.data),
    });
    this.alojSvc.getHabitacionesByAlojamiento(id).subscribe({
      next: r => this.habitaciones.set(r.data ?? []),
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  toggleRoom(id: number): void {
    this.selectedRooms.update(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  reservar(): void {
    if (!this.authStore.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      this.notify.error('Completa las fechas y el número de huéspedes.');
      return;
    }
    if (this.selectedRooms().size === 0) {
      this.notify.error('Selecciona al menos una habitación.');
      return;
    }

    const raw       = this.bookingForm.getRawValue();
    const clienteId = this.authStore.user()?.clienteId;
    if (!clienteId) {
      this.notify.error('No se encontró el perfil de cliente.');
      return;
    }

    const nights = this.nightCount();
    const habitaciones = Array.from(this.selectedRooms()).map(id => {
      const h = this.habitaciones().find(x => x.habitacionId === id)!;
      return { habitacionId: id, precioPorNoche: h.precioNoche ?? 0, numNoches: nights };
    });

    this.submitting.set(true);
    this.resvSvc.crearReserva({
      clienteId,
      alojamientoId: this.propiedad()!.alojamientoId,
      habitaciones,
      fechaCheckIn:  raw.fechaCheckIn!,
      fechaCheckOut: raw.fechaCheckOut!,
      numAdultos:    raw.numAdultos!,
      numNinos:      raw.numNinos ?? 0,
      llevaMascotas: raw.llevaMascotas ?? false,
    }).subscribe({
      next: r => {
        this.notify.success('¡Reserva creada! Procede al pago.');
        this.router.navigate(['/checkout', r.data.reservaId]);
      },
      error: () => this.submitting.set(false),
      complete: () => this.submitting.set(false),
    });
  }

  stars(n: number): number[] { return Array.from({ length: 5 }, (_, i) => i); }
  get today(): string { return new Date().toISOString().split('T')[0]; }
}
