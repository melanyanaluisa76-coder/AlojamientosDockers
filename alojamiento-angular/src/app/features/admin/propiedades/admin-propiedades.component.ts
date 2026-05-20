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
import { MatDialog } from '@angular/material/dialog';
import { AlojamientosService } from '../../../services/alojamientos.service';
import { AuthStore } from '../../../core/store/auth.store';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PropiedadItem, Ciudad, TipoAlojamiento } from '../../../core/models/alojamiento.model';

@Component({
  selector: 'app-admin-propiedades',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatCheckboxModule, MatDividerModule, MatTooltipModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './admin-propiedades.component.html',
  styleUrl: './admin-propiedades.component.scss',
})
export class AdminPropiedadesComponent implements OnInit {
  private readonly svc    = inject(AlojamientosService);
  private readonly auth   = inject(AuthStore);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly fb     = inject(FormBuilder);

  readonly propiedades = signal<PropiedadItem[]>([]);
  readonly ciudades    = signal<Ciudad[]>([]);
  readonly tipos       = signal<TipoAlojamiento[]>([]);
  readonly loading     = signal(true);
  readonly submitting  = signal(false);
  readonly showForm    = signal(false);

  readonly propForm = this.fb.group({
    nombre:            ['', [Validators.required, Validators.minLength(3)]],
    descripcion:       ['', Validators.required],
    direccion:         ['', Validators.required],
    ciudadId:          [null as number | null, Validators.required],
    tipoAlojamientoId: [null as number | null, Validators.required],
    estrellas:         [3, [Validators.required, Validators.min(1), Validators.max(5)]],
    admiteMascotas:    [false],
  });

  ngOnInit(): void {
    this.svc.getCiudades().subscribe({ next: r => this.ciudades.set(r.datos ?? []) });
    this.svc.getTiposAlojamiento().subscribe({ next: r => this.tipos.set(r.datos ?? []) });
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    const colaboradorId = this.auth.user()?.colaboradorId;
    if (colaboradorId && !this.auth.isAdmin()) {
      this.svc.getPropiedadesByColaborador(colaboradorId).subscribe({
        next: r => this.propiedades.set(r.datos ?? []),
        complete: () => this.loading.set(false),
        error: () => this.loading.set(false),
      });
    } else {
      this.svc.buscarPropiedades({ PageSize: 200 }).subscribe({
        next: r => {
          const d = r.datos;
          this.propiedades.set(d?.items ?? []);
        },
        complete: () => this.loading.set(false),
        error: () => this.loading.set(false),
      });
    }
  }

  guardar(): void {
    if (this.propForm.invalid) { this.propForm.markAllAsTouched(); return; }
    const colaboradorId = this.auth.user()?.colaboradorId;
    if (!colaboradorId) { this.notify.error('No se encontró el perfil de colaborador.'); return; }

    const raw = this.propForm.getRawValue();
    this.submitting.set(true);
    this.svc.crearPropiedad({
      nombre:            raw.nombre!,
      descripcion:       raw.descripcion!,
      direccion:         raw.direccion!,
      ciudadId:          raw.ciudadId!,
      tipoAlojamientoId: raw.tipoAlojamientoId!,
      estrellas:         raw.estrellas!,
      admiteMascotas:    raw.admiteMascotas ?? false,
      colaboradorId,
    }).subscribe({
      next: r => {
        this.propiedades.update(list => [r.datos, ...list]);
        this.notify.success('Propiedad creada correctamente.');
        this.propForm.reset({ estrellas: 3, admiteMascotas: false });
        this.showForm.set(false);
      },
      error: () => this.submitting.set(false),
      complete: () => this.submitting.set(false),
    });
  }

  toggleEstado(p: PropiedadItem): void {
    const nuevoEstado = p.estado === 'Activa' ? 'Inactiva' : 'Activa';
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `${nuevoEstado === 'Activa' ? 'Activar' : 'Desactivar'} propiedad`,
        message: `¿Confirmas cambiar el estado de "${p.nombre}" a ${nuevoEstado}?`,
        confirmLabel: 'Sí, cambiar',
      },
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.cambiarEstadoPropiedad(p.propiedadId, nuevoEstado).subscribe({
        next: () => {
          this.propiedades.update(list =>
            list.map(x => x.propiedadId === p.propiedadId ? { ...x, estado: nuevoEstado } : x),
          );
          this.notify.success('Estado actualizado.');
        },
      });
    });
  }

  stars(n: number): number[] { return Array.from({ length: 5 }, (_, i) => i); }
}
