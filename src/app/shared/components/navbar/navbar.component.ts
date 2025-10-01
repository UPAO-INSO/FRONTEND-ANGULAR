import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { environment } from '@environments/environment';

interface MenuOption {
  icon: string;
  label: string;
  route: string;
  sublabel: string;
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  authService = inject(AuthService);

  envs = environment;

  menuOptions: MenuOption[] = [
    {
      icon: 'fa-solid fa-list-check text-white',
      label: 'Mesas',
      sublabel: 'Seleccionar mesa',
      route: '/dashboard/tables',
    },
    {
      icon: 'fa-solid fa-table-list text-white',
      label: 'Pedidos',
      sublabel: 'Revisa tus pedidos',
      route: '/dashboard/orders',
    },
    {
      icon: 'fa-solid fa-file-invoice text-white',
      label: 'Facturación',
      sublabel: 'Comprueba tus facturas',
      route: '/dashboard/billing',
    },
    {
      icon: 'fa-solid fa-briefcase text-white',
      label: 'Inventario',
      sublabel: 'Gestiona tu inventario',
      route: '/dashboard/inventory',
    },
    {
      icon: 'fa-solid fa-cash-register text-white',
      label: 'Pagos',
      sublabel: 'Valida tus pagos',
      route: '/dashboard/payments',
    },
    {
      icon: 'fa-solid fa-utensils text-white',
      label: 'Cocina',
      sublabel: 'Gestiona los pedidos en cocina',
      route: '/dashboard/kitchen',
    },
  ];
}
