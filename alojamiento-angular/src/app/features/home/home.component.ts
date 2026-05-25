import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { AlojamientosService } from '../../services/alojamientos.service';
import { PropiedadItem } from '../../core/models/alojamiento.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatCardModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  readonly features = [
    { icon: 'verified',       title: 'Reservas Seguras',    desc: 'Sistema anti-overbooking con verificación de disponibilidad en tiempo real.' },
    { icon: 'payments',       title: 'Pagos Protegidos',    desc: 'Transacciones procesadas de forma segura.' },
    { icon: 'support_agent',  title: 'Soporte 24/7',        desc: 'Atención al cliente disponible para resolver cualquier inquietud.' },
    { icon: 'star',           title: 'Mejores Propiedades', desc: 'Catálogo curado de hoteles y suites con reseñas verificadas.' },
  ];

  private readonly svc    = inject(AlojamientosService);
  private readonly router = inject(Router);
  private readonly fb     = inject(FormBuilder);

  readonly destacadas  = signal<PropiedadItem[]>([]);
  readonly loadingDest = signal(true);

  readonly searchForm = this.fb.group({
    checkIn:  [''],
    checkOut: [''],
    adultos:  [1],
    ninos:    [0],
  });

  ngOnInit(): void {
    this.svc.getAlojamientos().subscribe({
      next: r => this.destacadas.set((r.data ?? []).slice(0, 6)),
      error: () => {},
      complete: () => this.loadingDest.set(false),
    });
  }

  search(): void {
    const { checkIn, checkOut, adultos, ninos } = this.searchForm.getRawValue();
    const params = new URLSearchParams();
    if (checkIn)  params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (adultos)  params.set('adultos', String(adultos));
    if (ninos)    params.set('ninos', String(ninos));
    this.router.navigate(['/propiedades'], { queryParams: Object.fromEntries(params) });
  }

  stars(n: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i);
  }
}
