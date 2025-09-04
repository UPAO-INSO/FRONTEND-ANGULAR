import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./orders/pages/dashboard-page/dashboard-page.component'),
    children: [
      {
        path: 'tables',
        loadComponent: () =>
          import('./orders/pages/tables-page/tables-page.component'),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./orders/pages/orders-page/orders-page.component'),
      },
      {
        path: 'billing',
        loadComponent: () =>
          import('./orders/pages/tables-page/tables-page.component'),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./orders/pages/tables-page/tables-page.component'),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./orders/pages/tables-page/tables-page.component'),
      },
      {
        path: '**',
        redirectTo: 'tables',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
