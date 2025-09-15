import { Routes } from '@angular/router';
import DashboardPageComponent from './shared/pages/dashboard-page/dashboard-page.component';

export const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardPageComponent,
    children: [
      {
        path: 'tables',
        loadChildren: () => import('./tables/table.routes'),
      },
      {
        path: 'orders',
        loadChildren: () => import('./orders/order.routes'),
      },
      {
        path: 'kitchen',
        loadChildren: () => import('./kitchen/kitchen.routes'),
      }
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
