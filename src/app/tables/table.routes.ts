import { Routes } from '@angular/router';
import { TableLayoutComponent } from './layouts/table-layout/table-layout.component';
import { TablesPageComponent } from './pages/tables-page/tables-page.component';
import { RegisterOrderPageComponent } from '../orders/pages/register-order-page/register-order-page.component';

export const tableRoutes: Routes = [
  {
    path: '',
    component: TableLayoutComponent,
    children: [
      {
        path: 'all',
        component: TablesPageComponent,
      },
      {
        path: 'create-order',
        component: RegisterOrderPageComponent,
      },
      {
        path: '**',
        redirectTo: 'all',
      },
    ],
  },
];

export default tableRoutes;
