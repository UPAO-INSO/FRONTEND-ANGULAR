import { Routes } from '@angular/router';
import DashboardPageComponent from './shared/pages/dashboard-page/dashboard-page.component';
import { NotAuthenticatedGuard } from '@auth/guards/not-authenticated.guard';
import { AuthGuard } from '@auth/guards/auth.guard';
import { RoleGuard } from '@auth/guards/role.guard';
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
        canActivate: [RoleGuard],
        data: { roles: ['MESERO', 'CAJERO', 'GERENTE', 'ADMINISTRADOR'] },
        loadComponent: () =>
          import('./tables/pages/tables-page/tables-page.component').then(
            (m) => m.TablesPageComponent,
          ),
      },
      {
        path: 'orders',
        canActivate: [RoleGuard],
        data: { roles: ['MESERO', 'CAJERO', 'COCINERO', 'GERENTE', 'ADMINISTRADOR'] },
        loadComponent: () =>
          import('./orders/pages/orders-page/orders-page.component'),
      },
      {
        path: 'kitchen',
        canActivate: [RoleGuard],
        data: { roles: ['COCINERO', 'GERENTE', 'ADMINISTRADOR'] },
        loadComponent: () =>
          import('./kitchen/pages/kitchen-page/kitchen-page.component'),
      },
      {
        path: 'payments',
        canActivate: [RoleGuard],
        data: { roles: ['CAJERO', 'GERENTE', 'ADMINISTRADOR'] },
        loadComponent: () =>
          import('./payments/pages/payments-page/payments-page.component').then(
            (m) => m.PaymentsPageComponent,
          ),
      },
      {
        path: 'vouchers',
        canActivate: [RoleGuard],
        data: { roles: ['CAJERO', 'GERENTE', 'ADMINISTRADOR'] },
        loadComponent: () =>
          import('./vouchers/pages/vouchers-page/vouchers-page.component'),
      },
      {
        path: 'inventory',
        canActivate: [RoleGuard],
        data: { roles: ['GERENTE', 'COCINERO', 'ADMINISTRADOR'] },
        loadChildren: () => import('./inventory/inventory.routes'),
      },
      {
        path: 'separaciones',
        canActivate: [RoleGuard],
        data: { roles: ['MESERO', 'COCINERO', 'GERENTE', 'ADMINISTRADOR'] },
        loadChildren: () => import('./separaciones/separaciones.routes'),
      },
      {
        path: 'pensionistas',
        canActivate: [RoleGuard],
        data: { roles: ['GERENTE', 'ADMINISTRADOR'] },
        loadChildren: () => import('./pensionistas/pensionistas.routes'),
      },

      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/pages/profile-page/profile-page.component').then(
            (m) => m.ProfilePageComponent,
          ),
      },

      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
