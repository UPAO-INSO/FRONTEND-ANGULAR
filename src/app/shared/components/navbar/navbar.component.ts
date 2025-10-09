import { Component, computed, inject, input, signal } from '@angular/core';
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

  // otros campos...
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
      route: '/dashboard/billing',
      allowedRoles: ['administrador', 'gerente', 'contador'],
    },
    {
      icon: 'fa-solid fa-briefcase text-white',
      label: 'Inventario',
      sublabel: 'Gestiona tu inventario',
      route: '/dashboard/inventory',
      allowedRoles: ['gerente', 'almacenero'],
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
      return []; // No mostrar nada si no hay jobTitle
    }

    return this.allMenuOptions.filter((option) => {
      // Si no tiene allowedRoles definidos, lo muestra a todos
      if (!option.allowedRoles || option.allowedRoles.length === 0) {
        return true;
      }

      // Verificar si el jobTitle actual está en los roles permitidos
      return option.allowedRoles.some(
        (role) =>
          role.toLowerCase() === currentJobTitle ||
          currentJobTitle.includes(role.toLowerCase())
      );
    });
  });

  constructor() {
    // ✅ Extraer jobTitle del localStorage al inicializar
    this.loadUserJobTitle();
  }

  // ✅ Método para extraer jobTitle del localStorage
  private loadUserJobTitle() {
    try {
      const userData = localStorage.getItem('user-data');
      if (userData) {
        const parsedUserData: UserData = JSON.parse(userData);

        // ✅ Extraer jobTitle
        const jobTitle = parsedUserData.jobTitle || parsedUserData.role || '';
        this.userJobTitle.set(jobTitle);

        console.log('👤 User jobTitle loaded:', jobTitle);
        console.log(
          '📋 Available menu options:',
          this.menuOptions().map((opt) => opt.label)
        );
      } else {
        console.warn('⚠️ No user-data found in localStorage');
        this.userJobTitle.set('');
      }
    } catch (error) {
      console.error('❌ Error parsing user-data from localStorage:', error);
      this.userJobTitle.set('');
    }
  }

  // ✅ Método para refrescar datos del usuario (útil si cambia la sesión)
  refreshUserData() {
    this.loadUserJobTitle();
  }

  // ✅ Método para obtener información del usuario actual
  getCurrentUserInfo() {
    try {
      const userData = localStorage.getItem('user-data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // ✅ Getter para usar en el template si necesitas mostrar info del usuario
  get currentUser(): UserData | null {
    return this.getCurrentUserInfo();
  }
}
