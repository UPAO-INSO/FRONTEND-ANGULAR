import { Component, computed, inject, input, output, signal } from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { ThemeService } from '@shared/services/theme.service';
import { WebSocketService } from '@shared/services/websocket.service';
import { environment } from '@environments/environment';

interface NavLink {
  icon: string;
  label: string;
  route: string;
  exact: boolean;
  color: string;
  allowedRoles?: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LowerCasePipe],
  templateUrl: './sidebar.component.html',
  host: { style: 'display: contents' },
})
export class SidebarComponent {
  readonly isOpen = input<boolean>(false);
  readonly closed = output<void>();

  themeService = inject(ThemeService);
  wsService    = inject(WebSocketService);
  authService  = inject(AuthService);
  envs = environment;

  private userRole = signal('');

  readonly navLinks: NavLink[] = [
    { icon: 'fa-solid fa-gauge-high',   label: 'Dashboard',    route: '/dashboard',    exact: true,  color: 'text-brand' },
    { icon: 'fa-solid fa-table',        label: 'Mesas',        route: '/tables',       exact: false, color: 'text-table-available',       allowedRoles: ['MESERO', 'CAJERO', 'GERENTE'] },
    { icon: 'fa-solid fa-receipt',      label: 'Pedidos',      route: '/orders',       exact: false, color: 'text-status-preparing',      allowedRoles: ['MESERO', 'CAJERO', 'COCINERO', 'GERENTE'] },
    { icon: 'fa-solid fa-utensils',     label: 'Cocina',       route: '/kitchen',      exact: false, color: 'text-status-to-preparation', allowedRoles: ['COCINERO', 'GERENTE'] },
    { icon: 'fa-solid fa-credit-card',  label: 'Pagos',        route: '/payments',     exact: false, color: 'text-brand',                 allowedRoles: ['CAJERO', 'GERENTE'] },
    { icon: 'fa-solid fa-file-invoice', label: 'Comprobantes', route: '/vouchers',     exact: false, color: 'text-status-paid',           allowedRoles: ['CAJERO', 'GERENTE'] },
    { icon: 'fa-solid fa-warehouse',    label: 'Inventario',   route: '/inventory',    exact: false, color: 'text-status-ready',          allowedRoles: ['GERENTE', 'COCINERO'] },
    { icon: 'fa-solid fa-bookmark',     label: 'Separaciones', route: '/separaciones', exact: false, color: 'text-yellow-400',            allowedRoles: ['MESERO', 'COCINERO', 'GERENTE'] },
    { icon: 'fa-solid fa-id-card',      label: 'Pensionistas', route: '/pensionistas', exact: false, color: 'text-purple-400',            allowedRoles: ['GERENTE'] },
  ];

  visibleLinks = computed(() => {
    const role = this.userRole().toUpperCase();
    if (!role) return this.navLinks;
    if (role === 'ADMINISTRADOR') return this.navLinks;
    return this.navLinks.filter(l =>
      !l.allowedRoles?.length || l.allowedRoles.includes(role)
    );
  });

  get currentUser() {
    try {
      const raw = localStorage.getItem('user-data');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  constructor() {
    try {
      const raw = localStorage.getItem('user-data');
      if (raw) {
        const d = JSON.parse(raw);
        this.userRole.set(d.role || d.jobTitle || '');
      }
    } catch {}
  }

  close() { this.closed.emit(); }

  onLogout() {
    this.closed.emit();
    this.authService.logout();
  }
}
