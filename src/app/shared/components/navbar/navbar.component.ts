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

  userRole = signal<string>('');

  allMenuOptions: MenuOption[] = [
    {
      icon: 'fa-solid fa-list-check',
      label: 'Mesas',
      sublabel: 'Seleccionar mesa',
      route: '/tables',
      allowedRoles: ['MESERO', 'CAJERO', 'GERENTE'],
    },
    {
      icon: 'fa-solid fa-table-list',
      label: 'Pedidos',
      sublabel: 'Revisa tus pedidos',
      route: '/orders',
      allowedRoles: ['MESERO', 'CAJERO', 'COCINERO', 'GERENTE'],
    },
    {
      icon: 'fa-solid fa-file-invoice',
      label: 'Facturación',
      sublabel: 'Comprueba tus facturas',
      route: '/vouchers',
      allowedRoles: ['CAJERO', 'GERENTE'],
    },
    {
      icon: 'fa-solid fa-briefcase',
      label: 'Inventario',
      sublabel: 'Gestiona tu inventario',
      route: '/inventory',
      allowedRoles: ['GERENTE', 'COCINERO'],
    },
    {
      icon: 'fa-solid fa-cash-register',
      label: 'Pagos',
      sublabel: 'Valida tus pagos',
      route: '/payments',
      allowedRoles: ['CAJERO', 'GERENTE'],
    },
    {
      icon: 'fa-solid fa-utensils',
      label: 'Cocina',
      sublabel: 'Gestiona los pedidos en cocina',
      route: '/kitchen',
      allowedRoles: ['COCINERO', 'GERENTE'],
    },
  ];

  menuOptions = computed(() => {
    const role = this.userRole().toUpperCase();
    if (!role) return [];
    // ADMINISTRADOR ve todas las opciones del menú
    if (role === 'ADMINISTRADOR') return this.allMenuOptions;
    return this.allMenuOptions.filter(opt =>
      !opt.allowedRoles?.length || opt.allowedRoles.includes(role)
    );
  });

  constructor() {
    this.loadUserRole();
  }

  private loadUserRole() {
    try {
      const raw = localStorage.getItem('user-data');
      if (raw) {
        const data: UserData = JSON.parse(raw);
        this.userRole.set(data.role || '');
      }
    } catch {
      this.userRole.set('');
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
