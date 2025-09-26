import { Routes } from '@angular/router';
import { TableLayoutComponent } from './layouts/table-layout/table-layout.component';
import { TablesPageComponent } from './pages/tables-page/tables-page.component';
import { RegisterOrderComponent } from '../orders/components/register-order/register-order.component';

export const tableRoutes: Routes = [
  {
    path: '',
    component: TableLayoutComponent,
    children: [
      {
        path: '',
        component: TablesPageComponent,
      },
      {
        path: 'create-order',
        component: RegisterOrderComponent,
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];

export default tableRoutes;
