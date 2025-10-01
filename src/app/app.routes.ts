import { Routes } from '@angular/router';
import DashboardPageComponent from './shared/pages/dashboard-page/dashboard-page.component';
import { NotAuthenticatedGuard } from '@auth/guards/not-authenticated.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes'),
    canMatch: [NotAuthenticatedGuard],
  },
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
      },
      {
        path: '**',
        redirectTo: 'tables',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'auth',
  },
];
