import { Routes } from '@angular/router';
import { OrderLayoutComponent } from './layouts/order-layout/order-layout.component';
import OrdersPageComponent from './pages/orders-page/orders-page.component';
import { RegisterOrderPageComponent } from './pages/register-order-page/register-order-page.component';

export const orderRoutes: Routes = [
  {
    path: '',
    component: OrderLayoutComponent,
    children: [
      {
        path: 'all',
        component: OrdersPageComponent,
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

export default orderRoutes;
