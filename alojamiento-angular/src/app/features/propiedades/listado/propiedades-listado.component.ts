import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { DecimalPipe } from '@angular/common';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { AlojamientosService } from '../../../services/alojamientos.service';
import { PropiedadItem, Ciudad, BuscarPropiedadesParams } from '../../../core/models/alojamiento.model';

@Component({
  selector: 'app-propiedades-listado',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule, DecimalPipe,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatCheckboxModule, MatChipsModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './propiedades-listado.component.html',
  styleUrl: './propiedades-listado.component.scss',
})
export class PropiedadesListadoComponent implements OnInit {
  private readonly svc   = inject(AlojamientosService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb    = inject(FormBuilder);

  readonly ciudades    = signal<Ciudad[]>([]);
  readonly propiedades = signal<PropiedadItem[]>([]);
  readonly loading     = signal(true);
  readonly totalItems  = signal(0);

  readonly filterForm = this.fb.group({
    nombre:         [''],
    CiudadId:       [null as number | null],
    EstrellasMinimas: [null as number | null],
    AdmiteMascotas: [false],
    FechaCheckIn:   [''],
    FechaCheckOut:  [''],
    NumAdultos:     [1],
    NumNinos:       [0],
  });

  readonly filtered = computed(() => {
    const nombre = this.filterForm.get('nombre')?.value?.toLowerCase() ?? '';
    return nombre
      ? this.propiedades().filter(p => p.nombre?.toLowerCase().includes(nombre))
      : this.propiedades();
  });

  ngOnInit(): void {
    this.svc.getCiudades().subscribe({ next: r => this.ciudades.set(r.datos ?? []) });

    const qp = this.route.snapshot.queryParams;
    if (qp['checkIn'])  this.filterForm.patchValue({ FechaCheckIn: qp['checkIn'] });
    if (qp['checkOut']) this.filterForm.patchValue({ FechaCheckOut: qp['checkOut'] });
    if (qp['adultos'])  this.filterForm.patchValue({ NumAdultos: +qp['adultos'] });
    if (qp['ninos'])    this.filterForm.patchValue({ NumNinos: +qp['ninos'] });

    this.buscar();
  }

  buscar(): void {
    this.loading.set(true);
    const raw = this.filterForm.getRawValue();

    const params: BuscarPropiedadesParams = {};
    if (raw.CiudadId)         params.CiudadId         = raw.CiudadId;
    if (raw.EstrellasMinimas) params.EstrellasMinimas  = raw.EstrellasMinimas;
    if (raw.AdmiteMascotas)   params.AdmiteMascotas    = raw.AdmiteMascotas;
    if (raw.FechaCheckIn)     params.FechaCheckIn      = raw.FechaCheckIn;
    if (raw.FechaCheckOut)    params.FechaCheckOut     = raw.FechaCheckOut;
    if (raw.NumAdultos)       params.NumAdultos        = raw.NumAdultos;
    if (raw.NumNinos)         params.NumNinos          = raw.NumNinos;

    this.svc.buscarPropiedades(params).subscribe({
      next: r => {
        const data = r.datos;
        const items = data?.items ?? (Array.isArray(data) ? data as PropiedadItem[] : []);
        this.propiedades.set(items);
        this.totalItems.set(data?.totalRecords ?? items.length);
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }

  limpiarFiltros(): void {
    this.filterForm.reset({ NumAdultos: 1, NumNinos: 0, AdmiteMascotas: false });
    this.buscar();
  }

  stars(n: number): number[] { return Array.from({ length: 5 }, (_, i) => i); }
}
