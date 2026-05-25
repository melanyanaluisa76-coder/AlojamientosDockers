import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { UsuariosService } from '../../../services/usuarios.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ColaboradorItem } from '../../../core/models/usuario.model';
import { UsuarioAdmin } from '../../../core/models/auth.model';

@Component({
  selector: 'app-admin-colaboradores',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDividerModule, MatTooltipModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './admin-colaboradores.component.html',
  styleUrl: './admin-colaboradores.component.scss',
})
export class AdminColaboradoresComponent implements OnInit {
  private readonly svc    = inject(UsuariosService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly fb     = inject(FormBuilder);

  readonly colaboradores = signal<ColaboradorItem[]>([]);
  readonly usuarios      = signal<UsuarioAdmin[]>([]);
  readonly loading       = signal(true);
  readonly submitting    = signal(false);
  readonly showForm      = signal(false);

  readonly colabForm = this.fb.group({
    usuarioId:     [null as number | null, Validators.required],
    nombreEmpresa: ['', [Validators.required, Validators.minLength(2)]],
    telefono:      ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-]{7,15}$/)]],
  });

  readonly usuariosDisponibles = computed(() => {
    const colabIds = new Set(this.colaboradores().map(c => c.usuarioId));
    return this.usuarios().filter(u => !colabIds.has(u.usuarioId));
  });

  ngOnInit(): void {
    this.svc.getUsuarios().subscribe({ next: r => this.usuarios.set(r.data ?? []) });
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.svc.getColaboradores().subscribe({
      next: r => this.colaboradores.set(r.data ?? []),
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  guardar(): void {
    if (this.colabForm.invalid) { this.colabForm.markAllAsTouched(); return; }
    const raw = this.colabForm.getRawValue();
    this.submitting.set(true);
    this.svc.crearColaborador({
      usuarioId:     raw.usuarioId!,
      nombreEmpresa: raw.nombreEmpresa!,
      telefono:      raw.telefono!,
    }).subscribe({
      next: r => {
        this.colaboradores.update(list => [r.data, ...list]);
        this.notify.success('Colaborador creado correctamente.');
        this.colabForm.reset();
        this.showForm.set(false);
      },
      error: () => this.submitting.set(false),
      complete: () => this.submitting.set(false),
    });
  }

  eliminar(c: ColaboradorItem): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar colaborador',
        message: `¿Eliminar a "${c.nombreCompleto ?? c.nombreEmpresa}"? Sus propiedades quedarán sin responsable.`,
        confirmLabel: 'Eliminar',
      },
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.eliminarColaborador(c.colaboradorId).subscribe({
        next: () => {
          this.colaboradores.update(list => list.filter(x => x.colaboradorId !== c.colaboradorId));
          this.notify.success('Colaborador eliminado.');
        },
        error: () => this.notify.error('No se pudo eliminar el colaborador.'),
      });
    });
  }
}
