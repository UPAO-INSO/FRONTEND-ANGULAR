import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface MenuOption {
  icon: string;
  label: string;
  route: string;
  sublabel: string;
}

@Component({
  selector: 'app-side-menu-options',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './side-menu-options.component.html',
})
export class SideMenuOptionsComponent {
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
  ];
}
