import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { AuthStore } from '../../core/store/auth.store';
import { NotificationService } from '../../core/services/notification.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatDividerModule, MatMenuModule,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  readonly authStore = inject(AuthStore);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);

  readonly sidenavOpen = signal(true);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard',     icon: 'dashboard',            route: '/admin' },
    { label: 'Propiedades',   icon: 'apartment',            route: '/admin/propiedades' },
    { label: 'Habitaciones',  icon: 'king_bed',             route: '/admin/habitaciones' },
    { label: 'Reservas',      icon: 'event_available',      route: '/admin/reservas' },
    { label: 'Usuarios',      icon: 'manage_accounts',      route: '/admin/usuarios',      adminOnly: true },
    { label: 'Colaboradores', icon: 'business',             route: '/admin/colaboradores', adminOnly: true },
  ];

  get visibleNavItems(): NavItem[] {
    return this.navItems.filter(item =>
      !item.adminOnly || this.authStore.isAdmin(),
    );
  }

  toggleSidenav(): void {
    this.sidenavOpen.update(v => !v);
  }

  logout(): void {
    this.authStore.logout();
    this.notify.info('Sesión cerrada.');
    this.router.navigate(['/']);
  }
}
