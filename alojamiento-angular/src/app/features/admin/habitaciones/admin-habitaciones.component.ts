import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencyPipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { AlojamientosService } from '../../../services/alojamientos.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { HabitacionItem, PropiedadItem } from '../../../core/models/alojamiento.model';

@Component({
  selector: 'app-admin-habitaciones',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatCheckboxModule, MatDividerModule, MatTooltipModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './admin-habitaciones.component.html',
  styleUrl: './admin-habitaciones.component.scss',
})
export class AdminHabitacionesComponent implements OnInit {
  private readonly svc    = inject(AlojamientosService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly fb     = inject(FormBuilder);

  readonly propiedades  = signal<PropiedadItem[]>([]);
  readonly habitaciones = signal<HabitacionItem[]>([]);
  readonly selectedProp = signal<number | null>(null);
  readonly loading      = signal(false);
  readonly submitting   = signal(false);
  readonly showForm     = signal(false);

  readonly habForm = this.fb.group({
    nombre:                ['', [Validators.required, Validators.minLength(2)]],
    descripcion:           [''],
    capacidadAdultos:      [2, [Validators.required, Validators.min(1)]],
    capacidadNinos:        [0, Validators.min(0)],
    numBanos:              [1, [Validators.required, Validators.min(1)]],
    numDormitorios:        [1, [Validators.required, Validators.min(1)]],
    superficieM2:          [null as number | null],
    precioPorNoche:        [null as number | null, [Validators.required, Validators.min(1)]],
    tieneCocina:           [false],
    tieneAireAcondicionado:[false],
  });

  ngOnInit(): void {
    this.svc.getAlojamientos().subscribe({
      next: r => this.propiedades.set(r.data ?? []),
    });
  }

  seleccionarPropiedad(alojamientoId: number): void {
    this.selectedProp.set(alojamientoId);
    this.loading.set(true);
    this.svc.getHabitacionesByAlojamiento(alojamientoId).subscribe({
      next: r => this.habitaciones.set(r.data ?? []),
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  guardar(): void {
    if (this.habForm.invalid) { this.habForm.markAllAsTouched(); return; }
    const alojamientoId = this.selectedProp();
    if (!alojamientoId) { this.notify.error('Selecciona una propiedad primero.'); return; }

    const raw = this.habForm.getRawValue();
    this.submitting.set(true);
    this.svc.crearHabitacion({
      alojamientoId,
      nombre:                raw.nombre!,
      descripcion:           raw.descripcion || undefined,
      precioPorNoche:        raw.precioPorNoche!,
      capacidadAdultos:      raw.capacidadAdultos!,
      capacidadNinos:        raw.capacidadNinos ?? 0,
      numBanos:              raw.numBanos!,
      numDormitorios:        raw.numDormitorios!,
      superficieM2:          raw.superficieM2 ?? null,
      tieneCocina:           raw.tieneCocina ?? false,
      tieneAireAcondicionado: raw.tieneAireAcondicionado ?? false,
    }).subscribe({
      next: r => {
        this.habitaciones.update(list => [...list, r.data]);
        this.notify.success('Habitación creada correctamente.');
        this.habForm.reset({ capacidadAdultos: 2, capacidadNinos: 0, numBanos: 1, numDormitorios: 1 });
        this.showForm.set(false);
      },
      error: () => this.submitting.set(false),
      complete: () => this.submitting.set(false),
    });
  }

  eliminar(h: HabitacionItem): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar habitación',
        message: `¿Eliminar "${h.nombre}"? Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
      },
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.eliminarHabitacion(h.habitacionId).subscribe({
        next: () => {
          this.habitaciones.update(list => list.filter(x => x.habitacionId !== h.habitacionId));
          this.notify.success('Habitación eliminada.');
        },
        error: () => this.notify.error('No se pudo eliminar la habitación.'),
      });
    });
  }
}
