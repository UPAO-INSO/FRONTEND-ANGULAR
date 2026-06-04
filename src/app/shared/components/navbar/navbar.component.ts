import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { ThemeService } from '@shared/services/theme.service';
import { environment } from '@environments/environment';

interface MenuOption {
  icon: string;
  label: string;
  route: string;
  sublabel: string;
  allowedRoles?: string[];
}

export interface UserData {
  id: number;
  fullName: string;
  username: string;
  email: string;
  jobTitle: string;
  role?: string;
  isActive: boolean;
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  authService  = inject(AuthService);
  themeService = inject(ThemeService);
  envs = environment;

  userJobTitle = signal<string>('');

  allMenuOptions: MenuOption[] = [
    {
      icon: 'fa-solid fa-list-check',
      label: 'Mesas',
      sublabel: 'Seleccionar mesa',
      route: '/dashboard/tables',
      allowedRoles: ['mesero', 'gerente'],
    },
    {
      icon: 'fa-solid fa-table-list',
      label: 'Pedidos',
      sublabel: 'Revisa tus pedidos',
      route: '/dashboard/orders',
      allowedRoles: ['gerente', 'cocina'],
    },
    {
      icon: 'fa-solid fa-file-invoice',
      label: 'Facturación',
      sublabel: 'Comprueba tus facturas',
      route: '/dashboard/vouchers',
      allowedRoles: ['administrador', 'gerente', 'cajero'],
    },
    {
      icon: 'fa-solid fa-briefcase',
      label: 'Inventario',
      sublabel: 'Gestiona tu inventario',
      route: '/dashboard/inventory',
      allowedRoles: ['gerente', 'cocinero'],
    },
    {
      icon: 'fa-solid fa-cash-register',
      label: 'Pagos',
      sublabel: 'Valida tus pagos',
      route: '/dashboard/payments',
      allowedRoles: ['gerente', 'cajero'],
    },
    {
      icon: 'fa-solid fa-utensils',
      label: 'Cocina',
      sublabel: 'Gestiona los pedidos en cocina',
      route: '/dashboard/kitchen',
      allowedRoles: ['cocinero', 'gerente'],
    },
  ];

  menuOptions = computed(() => {
    const jobTitle = this.userJobTitle().toLowerCase();
    if (!jobTitle) return [];
    return this.allMenuOptions.filter(opt =>
      !opt.allowedRoles?.length ||
      opt.allowedRoles.some(r =>
        r.toLowerCase() === jobTitle || jobTitle.includes(r.toLowerCase())
      )
    );
  });

  constructor() {
    this.loadUserJobTitle();
  }

  private loadUserJobTitle() {
    try {
      const raw = localStorage.getItem('user-data');
      if (raw) {
        const data: UserData = JSON.parse(raw);
        this.userJobTitle.set(data.jobTitle || data.role || '');
      }
    } catch {
      this.userJobTitle.set('');
    }
  }

  get currentUser(): UserData | null {
    try {
      const raw = localStorage.getItem('user-data');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
