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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AlojamientosService } from '../../../services/alojamientos.service';
import { FotosService } from '../../../services/fotos.service';
import { CloudinaryService } from '../../../services/cloudinary.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PropiedadItem, FotoItem } from '../../../core/models/alojamiento.model';

const TIPOS_ALOJAMIENTO = [
  { id: 1, nombre: 'Hotel' },
  { id: 2, nombre: 'Hostal' },
  { id: 3, nombre: 'Apartamento' },
  { id: 4, nombre: 'Cabaña' },
  { id: 5, nombre: 'Casa' },
];

@Component({
  selector: 'app-admin-propiedades',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatCheckboxModule, MatDividerModule, MatTooltipModule,
    MatProgressSpinnerModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './admin-propiedades.component.html',
  styleUrl: './admin-propiedades.component.scss',
})
export class AdminPropiedadesComponent implements OnInit {
  private readonly svc        = inject(AlojamientosService);
  private readonly fotosSvc   = inject(FotosService);
  private readonly cloudinary = inject(CloudinaryService);
  private readonly notify     = inject(NotificationService);
  private readonly fb         = inject(FormBuilder);

  readonly propiedades      = signal<PropiedadItem[]>([]);
  readonly tiposAlojamiento = TIPOS_ALOJAMIENTO;
  readonly loading          = signal(true);
  readonly submitting       = signal(false);
  readonly showForm         = signal(false);

  readonly fotoPropId   = signal<number | null>(null);
  readonly fotos        = signal<FotoItem[]>([]);
  readonly uploading    = signal(false);

  readonly propForm = this.fb.group({
    nombre:            ['', [Validators.required, Validators.minLength(3)]],
    descripcion:       [''],
    ciudad:            [''],
    direccion:         ['', Validators.required],
    tipoAlojamientoId: [null as number | null, Validators.required],
    socioId:           [null as number | null, Validators.required],
    admiteMascotas:    [false],
    tienePiscina:      [false],
    tieneParqueadero:  [false],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.svc.getAlojamientos().subscribe({
      next: r => this.propiedades.set(r.data ?? []),
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  guardar(): void {
    if (this.propForm.invalid) { this.propForm.markAllAsTouched(); return; }

    const raw = this.propForm.getRawValue();
    this.submitting.set(true);
    this.svc.crearAlojamiento({
      nombre:            raw.nombre!,
      descripcion:       raw.descripcion || undefined,
      ciudad:            raw.ciudad || undefined,
      direccion:         raw.direccion!,
      tipoAlojamientoId: raw.tipoAlojamientoId!,
      socioId:           raw.socioId!,
      admiteMascotas:    raw.admiteMascotas ?? false,
      tienePiscina:      raw.tienePiscina ?? false,
      tieneParqueadero:  raw.tieneParqueadero ?? false,
    }).subscribe({
      next: r => {
        this.propiedades.update(list => [r.data, ...list]);
        this.notify.success('Propiedad creada correctamente.');
        this.propForm.reset({ admiteMascotas: false, tienePiscina: false, tieneParqueadero: false });
        this.showForm.set(false);
      },
      error: () => this.submitting.set(false),
      complete: () => this.submitting.set(false),
    });
  }

  // ── Gestión de fotos ─────────────────────────────────────────────────────

  abrirFotos(propId: number): void {
    if (this.fotoPropId() === propId) { this.fotoPropId.set(null); return; }
    this.fotoPropId.set(propId);
    this.fotos.set([]);
    this.fotosSvc.getFotosByAlojamiento(propId).subscribe({
      next: r => this.fotos.set((r.data ?? []).sort((a, b) => a.orden - b.orden)),
    });
  }

  onFileSelected(event: Event, propId: number): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.notify.error('Solo se permiten imágenes JPG, PNG o WebP.');
      return;
    }

    this.uploading.set(true);
    this.cloudinary.uploadImage(file).subscribe({
      next: result => {
        this.fotosSvc.agregarFoto({
          alojamientoId: propId,
          url: result.secure_url,
          orden: this.fotos().length,
        }).subscribe({
          next: r => {
            this.fotos.update(list => [...list, r.data]);
            this.notify.success('Foto subida correctamente.');
          },
          error: () => this.notify.error('Error al guardar la foto en el servidor.'),
          complete: () => this.uploading.set(false),
        });
      },
      error: () => {
        this.notify.error('Error al subir la imagen a Cloudinary. Verifica el upload preset.');
        this.uploading.set(false);
      },
    });
  }

  eliminarFoto(fotoId: number): void {
    this.fotosSvc.eliminarFoto(fotoId).subscribe({
      next: () => {
        this.fotos.update(list => list.filter(f => f.fotoId !== fotoId));
        this.notify.success('Foto eliminada.');
      },
      error: () => this.notify.error('Error al eliminar la foto.'),
    });
  }
}
