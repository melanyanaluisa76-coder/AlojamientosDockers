import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // ── Layout público (Navbar + Footer) ────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
      },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
      },
      {
        path: 'propiedades',
        loadComponent: () => import('./features/propiedades/listado/propiedades-listado.component').then(m => m.PropiedadesListadoComponent),
      },
      {
        path: 'propiedades/:id',
        loadComponent: () => import('./features/propiedades/detalle/propiedad-detalle.component').then(m => m.PropiedadDetalleComponent),
      },
      {
        path: 'mis-reservas',
        canActivate: [authGuard],
        loadComponent: () => import('./features/reservas/mis-reservas/mis-reservas.component').then(m => m.MisReservasComponent),
      },
      {
        path: 'checkout/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./features/reservas/checkout/checkout.component').then(m => m.CheckoutComponent),
      },
      {
        path: 'factura/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./features/reservas/factura/factura.component').then(m => m.FacturaComponent),
      },
    ],
  },

  // ── Layout Admin (sidenav propio) ────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./layouts/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'propiedades',
        loadComponent: () => import('./features/admin/propiedades/admin-propiedades.component').then(m => m.AdminPropiedadesComponent),
      },
      {
        path: 'habitaciones',
        loadComponent: () => import('./features/admin/habitaciones/admin-habitaciones.component').then(m => m.AdminHabitacionesComponent),
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./features/admin/usuarios/admin-usuarios.component').then(m => m.AdminUsuariosComponent),
      },
      {
        path: 'colaboradores',
        loadComponent: () => import('./features/admin/colaboradores/admin-colaboradores.component').then(m => m.AdminColaboradoresComponent),
      },
      {
        path: 'reservas',
        loadComponent: () => import('./features/admin/reservas/admin-reservas.component').then(m => m.AdminReservasComponent),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
