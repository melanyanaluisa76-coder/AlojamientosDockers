import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UsuariosService } from '../../../services/usuarios.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { UsuarioAdmin, Rol } from '../../../core/models/auth.model';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [
    ReactiveFormsModule, DatePipe,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatSlideToggleModule, MatTooltipModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './admin-usuarios.component.html',
  styleUrl: './admin-usuarios.component.scss',
})
export class AdminUsuariosComponent implements OnInit {
  private readonly svc    = inject(UsuariosService);
  private readonly notify = inject(NotificationService);
  private readonly fb     = inject(FormBuilder);

  readonly usuarios  = signal<UsuarioAdmin[]>([]);
  readonly roles     = signal<Rol[]>([]);
  readonly loading   = signal(true);
  readonly updating  = signal<number | null>(null);

  readonly filterForm = this.fb.group({ search: [''] });

  readonly filtered = computed(() => {
    const q = this.filterForm.get('search')?.value?.toLowerCase() ?? '';
    return q
      ? this.usuarios().filter(u =>
          u.nombreCompleto?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.rolNombre?.toLowerCase().includes(q))
      : this.usuarios();
  });

  ngOnInit(): void {
    this.svc.getRoles().subscribe({ next: r => this.roles.set(r.data ?? []) });
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.svc.getUsuarios().subscribe({
      next: r => this.usuarios.set(r.data ?? []),
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  cambiarRol(u: UsuarioAdmin, rolId: number): void {
    this.updating.set(u.usuarioId);
    this.svc.cambiarRol(u.usuarioId, rolId).subscribe({
      next: () => {
        const rol = this.roles().find(r => r.rolId === rolId);
        this.usuarios.update(list =>
          list.map(x => x.usuarioId === u.usuarioId ? { ...x, rolId, rolNombre: rol?.nombre ?? '' } : x),
        );
        this.notify.success('Rol actualizado.');
      },
      error: () => this.notify.error('No se pudo cambiar el rol.'),
      complete: () => this.updating.set(null),
    });
  }

  toggleEstado(u: UsuarioAdmin): void {
    const activo = !u.estado;
    this.updating.set(u.usuarioId);
    this.svc.cambiarEstadoUsuario(u.usuarioId, activo).subscribe({
      next: () => {
        this.usuarios.update(list =>
          list.map(x => x.usuarioId === u.usuarioId ? { ...x, estado: activo } : x),
        );
        this.notify.success(`Usuario ${activo ? 'activado' : 'desactivado'}.`);
      },
      error: () => this.notify.error('No se pudo cambiar el estado.'),
      complete: () => this.updating.set(null),
    });
  }
}
