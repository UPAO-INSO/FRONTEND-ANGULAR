import { Routes } from '@angular/router';
import DashboardPageComponent from './shared/pages/dashboard-page/dashboard-page.component';
import { NotAuthenticatedGuard } from '@auth/guards/not-authenticated.guard';
import { AuthGuard } from '@auth/guards/auth.guard';
import { TermsPageComponent } from './shared/pages/terms-page/terms-page.component';
import { AboutPageComponent } from './shared/pages/about-page/about-page.component';

export const routes: Routes = [
  // Rutas públicas — antes del shell para no ser atrapadas por path:''
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes'),
    canMatch: [NotAuthenticatedGuard],
  },
  { path: 'terms', component: TermsPageComponent },
  { path: 'about', component: AboutPageComponent },

  // Shell autenticado — protegido por AuthGuard
  {
    path: '',
    component: DashboardPageComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./shared/pages/dashboard-home/dashboard-home.component'),
      },
      {
        path: 'tables',
        loadComponent: () =>
          import('./tables/pages/tables-page/tables-page.component').then(
            (m) => m.TablesPageComponent,
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./orders/pages/orders-page/orders-page.component'),
      },
      {
        path: 'kitchen',
        loadComponent: () =>
          import('./kitchen/pages/kitchen-page/kitchen-page.component'),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./payments/pages/payments-page/payments-page.component').then(
            (m) => m.PaymentsPageComponent,
          ),
      },
      {
        path: 'vouchers',
        loadComponent: () =>
          import('./vouchers/pages/vouchers-page/vouchers-page.component'),
      },
      {
        path: 'inventory',
        loadChildren: () => import('./inventory/inventory.routes'),
      },
      {
        path: 'separaciones',
        loadChildren: () => import('./separaciones/separaciones.routes'),
      },
      {
        path: 'pensionistas',
        loadChildren: () => import('./pensionistas/pensionistas.routes'),
      },

      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
