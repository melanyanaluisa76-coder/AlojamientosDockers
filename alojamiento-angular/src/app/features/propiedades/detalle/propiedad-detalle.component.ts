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
import { PropiedadItem, HabitacionItem, FotoItem } from '../../../core/models/alojamiento.model';
import { ReservaResponse } from '../../../core/models/reserva.model';
import { FotosService } from '../../../services/fotos.service';

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
  private readonly fotosSvc = inject(FotosService);
  readonly authStore         = inject(AuthStore);
  private readonly notify   = inject(NotificationService);

  readonly propiedad      = signal<PropiedadItem | null>(null);
  readonly habitaciones   = signal<HabitacionItem[]>([]);
  readonly fotos          = signal<FotoItem[]>([]);
  readonly galleryIdx     = signal(0);
  readonly loading        = signal(true);
  readonly submitting     = signal(false);
  readonly selectedRooms  = signal<Set<number>>(new Set());
  private readonly existingReservas = signal<ReservaResponse[]>([]);

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
    this.fotosSvc.getFotosByAlojamiento(id).subscribe({
      next: r => {
        const sorted = (r.data ?? []).sort((a, b) => a.orden - b.orden);
        this.fotos.set(sorted);
      },
    });

    const clienteId = this.authStore.user()?.clienteId;
    if (clienteId) {
      this.resvSvc.getReservasByCliente(clienteId).subscribe({
        next: r => this.existingReservas.set(r.data ?? []),
      });
    }
  }

  prevPhoto(): void {
    this.galleryIdx.update(i => (i - 1 + this.fotos().length) % this.fotos().length);
  }

  nextPhoto(): void {
    this.galleryIdx.update(i => (i + 1) % this.fotos().length);
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

    if (this.nightCount() === 0) {
      this.notify.error('Las fechas seleccionadas no son válidas: el check-out debe ser posterior al check-in.');
      return;
    }

    // Validación de capacidad
    const selectedHabs = this.habitaciones().filter(h => this.selectedRooms().has(h.habitacionId));
    const totalCapacity = selectedHabs.reduce((acc, h) => acc + h.capacidadAdultos, 0);
    if ((raw.numAdultos ?? 0) > totalCapacity) {
      this.notify.error(`Las habitaciones seleccionadas admiten máximo ${totalCapacity} adulto(s).`);
      return;
    }

    // Validación de conflicto de fechas
    const checkIn     = new Date(raw.fechaCheckIn!);
    const checkOut    = new Date(raw.fechaCheckOut!);
    const selectedIds = Array.from(this.selectedRooms());
    const activeStates = ['Pendiente', 'Confirmada', 'Activa', 'Completada'];

    // Check 1: localStorage — rastreo exacto por habitacionId (confiable)
    type BookedSlot = { habitacionId: number; checkIn: string; checkOut: string };
    const storedSlots: BookedSlot[] = JSON.parse(localStorage.getItem('booked_slots') || '[]');
    const hasLocalConflict = storedSlots.some(slot =>
      selectedIds.includes(slot.habitacionId) &&
      checkIn < new Date(slot.checkOut) && checkOut > new Date(slot.checkIn)
    );

    // Check 2: backend — por alojamientoId con fechas solapadas (backup cuando detallesHabitacion es nulo)
    const alojId = this.propiedad()!.alojamientoId;
    const hasBackendConflict = this.existingReservas()
      .filter(r => activeStates.includes(r.estado) && r.alojamientoId === alojId)
      .some(r => checkIn < new Date(r.fechaCheckOut) && checkOut > new Date(r.fechaCheckIn));

    if (hasLocalConflict || hasBackendConflict) {
      this.notify.error('Una o más habitaciones ya están reservadas para esas fechas.');
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
        // Persistir habitaciones reservadas en localStorage para detección de conflictos futura
        type BookedSlot = { habitacionId: number; checkIn: string; checkOut: string };
        const storedSlots: BookedSlot[] = JSON.parse(localStorage.getItem('booked_slots') || '[]');
        selectedIds.forEach(id => storedSlots.push({
          habitacionId: id,
          checkIn: raw.fechaCheckIn!,
          checkOut: raw.fechaCheckOut!,
        }));
        localStorage.setItem('booked_slots', JSON.stringify(storedSlots));

        // Guardar reservaId para que el dashboard admin pueda agregarlo
        const adminIds: number[] = JSON.parse(localStorage.getItem('admin_reserva_ids') || '[]');
        if (!adminIds.includes(r.data.reservaId)) {
          adminIds.push(r.data.reservaId);
          localStorage.setItem('admin_reserva_ids', JSON.stringify(adminIds));
        }

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
