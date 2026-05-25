import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DecimalPipe } from '@angular/common';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { AlojamientosService } from '../../../services/alojamientos.service';
import { PropiedadItem } from '../../../core/models/alojamiento.model';

@Component({
  selector: 'app-propiedades-listado',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule, DecimalPipe,
    MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatCheckboxModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './propiedades-listado.component.html',
  styleUrl: './propiedades-listado.component.scss',
})
export class PropiedadesListadoComponent implements OnInit {
  private readonly svc   = inject(AlojamientosService);
  private readonly fb    = inject(FormBuilder);

  readonly propiedades = signal<PropiedadItem[]>([]);
  readonly loading     = signal(true);
  readonly totalItems  = signal(0);

  readonly filterForm = this.fb.group({
    nombre:         [''],
    AdmiteMascotas: [false],
  });

  readonly filtered = computed(() => {
    const nombre        = this.filterForm.get('nombre')?.value?.toLowerCase() ?? '';
    const soloMascotas  = this.filterForm.get('AdmiteMascotas')?.value ?? false;
    return this.propiedades().filter(p => {
      const matchNombre   = !nombre || p.nombre?.toLowerCase().includes(nombre);
      const matchMascotas = !soloMascotas || p.admiteMascotas;
      return matchNombre && matchMascotas;
    });
  });

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    this.loading.set(true);
    this.svc.getAlojamientos().subscribe({
      next: r => {
        const items = r.data ?? [];
        this.propiedades.set(Array.isArray(items) ? items : []);
        this.totalItems.set(this.propiedades().length);
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }

  limpiarFiltros(): void {
    this.filterForm.reset({ AdmiteMascotas: false });
  }

  stars(n: number): number[] { return Array.from({ length: 5 }, (_, i) => i); }
}
