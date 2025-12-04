import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
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
  authService = inject(AuthService);
  envs = environment;

  userJobTitle = signal<string>('');

  allMenuOptions: MenuOption[] = [
    {
      icon: 'fa-solid fa-list-check text-white',
      label: 'Mesas',
      sublabel: 'Seleccionar mesa',
      route: '/dashboard/tables',
      allowedRoles: ['mesero', 'gerente'],
    },
    {
      icon: 'fa-solid fa-table-list text-white',
      label: 'Pedidos',
      sublabel: 'Revisa tus pedidos',
      route: '/dashboard/orders',
      allowedRoles: ['gerente', 'cocina'],
    },
    {
      icon: 'fa-solid fa-file-invoice text-white',
      label: 'Facturación',
      sublabel: 'Comprueba tus facturas',
      route: '/dashboard/vouchers',
      allowedRoles: ['administrador', 'gerente', 'cajero'],
    },
    {
      icon: 'fa-solid fa-briefcase text-white',
      label: 'Inventario',
      sublabel: 'Gestiona tu inventario',
      route: '/dashboard/inventory',
      allowedRoles: ['gerente', 'cocinero'],
    },
    {
      icon: 'fa-solid fa-cash-register text-white',
      label: 'Pagos',
      sublabel: 'Valida tus pagos',
      route: '/dashboard/payments',
      allowedRoles: ['gerente', 'cajero'],
    },
    {
      icon: 'fa-solid fa-utensils text-white',
      label: 'Cocina',
      sublabel: 'Gestiona los pedidos en cocina',
      route: '/dashboard/kitchen',
      allowedRoles: ['cocinero', 'gerente'],
    },
  ];

  menuOptions = computed(() => {
    const currentJobTitle = this.userJobTitle().toLowerCase();

    if (!currentJobTitle) {
      return [];
    }

    return this.allMenuOptions.filter((option) => {
      if (!option.allowedRoles || option.allowedRoles.length === 0) {
        return true;
      }

      return option.allowedRoles.some(
        (role) =>
          role.toLowerCase() === currentJobTitle ||
          currentJobTitle.includes(role.toLowerCase())
      );
    });
  });

  constructor() {
    this.loadUserJobTitle();
  }

  private loadUserJobTitle() {
    try {
      const userData = localStorage.getItem('user-data');
      if (userData) {
        const parsedUserData: UserData = JSON.parse(userData);

        const jobTitle = parsedUserData.jobTitle || parsedUserData.role || '';
        this.userJobTitle.set(jobTitle);
      } else {
        console.warn('No user-data found in localStorage');
        this.userJobTitle.set('');
      }
    } catch (error) {
      console.error('Error parsing user-data from localStorage:', error);
      this.userJobTitle.set('');
    }
  }

  refreshUserData() {
    this.loadUserJobTitle();
  }

  getCurrentUserInfo() {
    try {
      const userData = localStorage.getItem('user-data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  get currentUser(): UserData | null {
    return this.getCurrentUserInfo();
  }
}
