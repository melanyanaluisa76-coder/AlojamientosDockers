import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UsuariosService } from '../../../services/usuarios.service';
import { NotificationService } from '../../../core/services/notification.service';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pass    = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pass === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly svc    = inject(UsuariosService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);

  readonly loading      = signal(false);
  readonly showPassword = signal(false);

  readonly form = this.fb.group({
    nombreCompleto:  ['', [Validators.required, Validators.minLength(3)]],
    email:           ['', [Validators.required, Validators.email]],
    cedula:          ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    telefono:        ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    domicilio:       ['', Validators.required],
    password:        ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordMatchValidator });

  togglePassword(): void { this.showPassword.update(v => !v); }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);

    const { nombreCompleto, email, password, cedula, telefono, domicilio } = this.form.getRawValue();
    this.svc.register({
      nombreCompleto: nombreCompleto!,
      email:          email!,
      password:       password!,
      cedula:         cedula!,
      telefono:       telefono!,
      domicilio:      domicilio!,
    }).subscribe({
      next: () => {
        this.notify.success('¡Cuenta creada exitosamente! Ahora inicia sesión.');
        this.router.navigate(['/login']);
      },
      error: err => {
        const data = err.error;
        if (data?.errors?.length) {
          data.errors.forEach((e: string) => this.notify.error(e));
        } else {
          this.notify.error(data?.message ?? 'Error al crear la cuenta.');
        }
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
