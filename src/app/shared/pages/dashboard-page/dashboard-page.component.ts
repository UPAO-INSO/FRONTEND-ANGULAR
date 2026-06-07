import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { ThemeService } from '@shared/services/theme.service';
import { NotificationsComponent } from '@shared/components/notifications/notifications.component';
import { SessionWarningComponent } from '@shared/components/session-warning/session-warning.component';
import { NotificationService } from '@shared/services/notification.service';
import { WebSocketService } from '@shared/services/websocket.service';
import { environment } from '@environments/environment';

interface NavLink {
  icon:  string;
  label: string;
  route: string;
  exact: boolean;
  color: string;
  allowedRoles?: string[];
}

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationsComponent, SessionWarningComponent],
  templateUrl: './dashboard-page.component.html',
})
export default class DashboardPageComponent {
  private authService = inject(AuthService);
  themeService = inject(ThemeService);
  wsService    = inject(WebSocketService);
  private _notif = inject(NotificationService);
  envs = environment;

  sidebarOpen = signal(false);
  private jobTitle = signal('');

  readonly navLinks: NavLink[] = [
    { icon: 'fa-solid fa-gauge-high',   label: 'Dashboard',      route: '/dashboard',  exact: true,  color: 'text-brand' },
    { icon: 'fa-solid fa-table',         label: 'Mesas',          route: '/tables',    exact: false, color: 'text-table-available',        allowedRoles: ['mesero', 'gerente'] },
    { icon: 'fa-solid fa-receipt',       label: 'Pedidos',        route: '/orders',    exact: false, color: 'text-status-preparing',       allowedRoles: ['gerente', 'cajero', 'mesero', 'cocina'] },
    { icon: 'fa-solid fa-utensils',      label: 'Cocina',         route: '/kitchen',   exact: false, color: 'text-status-to-preparation',  allowedRoles: ['cocinero', 'gerente'] },
    { icon: 'fa-solid fa-credit-card',   label: 'Pagos',          route: '/payments',  exact: false, color: 'text-brand',                  allowedRoles: ['gerente', 'cajero'] },
    { icon: 'fa-solid fa-file-invoice',  label: 'Comprobantes',   route: '/vouchers',  exact: false, color: 'text-status-paid',            allowedRoles: ['administrador', 'gerente', 'cajero'] },
    { icon: 'fa-solid fa-warehouse',     label: 'Inventario',     route: '/inventory',     exact: false, color: 'text-status-ready',    allowedRoles: ['gerente', 'cocinero'] },
    { icon: 'fa-solid fa-bookmark',      label: 'Separaciones',   route: '/separaciones',  exact: false, color: 'text-yellow-400',      allowedRoles: ['gerente', 'mesero', 'cajero'] },
    { icon: 'fa-solid fa-id-card',       label: 'Pensionistas',   route: '/pensionistas',  exact: false, color: 'text-purple-400',      allowedRoles: ['gerente', 'cajero'] },
  ];

  visibleLinks = computed(() => {
    const job = this.jobTitle().toLowerCase();
    if (!job) return this.navLinks;
    return this.navLinks.filter(l =>
      !l.allowedRoles?.length ||
      l.allowedRoles.some(r => r.toLowerCase() === job || job.includes(r.toLowerCase()))
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
        this.jobTitle.set(d.jobTitle || d.role || '');
      }
    } catch {}
  }

  toggleSidebar() { this.sidebarOpen.update(v => !v); }
  closeSidebar()  { this.sidebarOpen.set(false); }

  onLogout() {
    this.closeSidebar();
    this.authService.logout();
  }
}
