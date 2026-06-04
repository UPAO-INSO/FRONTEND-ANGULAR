import { Routes } from '@angular/router';
import DashboardPageComponent from './shared/pages/dashboard-page/dashboard-page.component';
import { NotAuthenticatedGuard } from '@auth/guards/not-authenticated.guard';
import { TermsPageComponent } from './shared/pages/terms-page/terms-page.component';
import { AboutPageComponent } from './shared/pages/about-page/about-page.component';

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
        path: '',
        loadComponent: () =>
          import('./shared/pages/dashboard-home/dashboard-home.component'),
      },
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
        path: 'payments',
        loadChildren: () => import('./payments/payment.routes'),
      },
      {
        path: 'vouchers',
        loadChildren: () => import('./vouchers/voucher.routes'),
      },
      {
        path: 'inventory',
        loadChildren: () => import('./inventory/inventory.routes'),
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
  {
    path: 'terms',
    component: TermsPageComponent,
  },
  {
    path: 'about',
    component: AboutPageComponent,
  },
  {
    path: '**',
    redirectTo: 'auth',
  },
];
