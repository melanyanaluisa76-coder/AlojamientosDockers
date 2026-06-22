import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UsuariosService } from '../../../services/usuarios.service';
import { AuthStore } from '../../../core/store/auth.store';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb          = inject(FormBuilder);
  private readonly svc         = inject(UsuariosService);
  private readonly authStore   = inject(AuthStore);
  private readonly notify      = inject(NotificationService);
  private readonly router      = inject(Router);

  readonly loading      = signal(false);
  readonly showPassword = signal(false);

  readonly form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  togglePassword(): void { this.showPassword.update(v => !v); }

  loginDemo(tipo: 'admin' | 'cliente'): void {
    const email = tipo === 'admin' ? 'admin@demo.com' : 'cliente@demo.com';
    this.form.setValue({ email, password: 'Demo12345!' });
    this.submit();
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);

    const { email, password } = this.form.getRawValue();
    this.svc.login({ email: email!, password: password! }).subscribe({
      next: res => {
        this.authStore.login(res.data);
        const navigate = () => {
          this.notify.success(`¡Bienvenido, ${res.data.nombreCompleto}!`);
          this.router.navigate([this.authStore.hasAdminAccess() ? '/admin' : '/propiedades']);
        };
        // Sección 9.3 del contrato: si clienteId viene null para un Cliente, buscar por email
        if (!res.data.clienteId && res.data.roles?.includes('Cliente')) {
          this.svc.getClientes().pipe(catchError(() => of(null))).subscribe(clientes => {
            const found = clientes?.data?.find(c => c.email === res.data.email);
            if (found?.clienteId) this.authStore.setClienteId(found.clienteId);
            navigate();
          });
        } else {
          navigate();
        }
      },
      error: err => {
        const msg = err.error?.message ?? 'Credenciales inválidas.';
        this.notify.error(msg);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
