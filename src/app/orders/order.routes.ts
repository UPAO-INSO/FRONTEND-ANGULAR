import { Routes } from '@angular/router';
import { OrderLayoutComponent } from './layouts/order-layout/order-layout.component';
import OrdersPageComponent from './pages/orders-page/orders-page.component';
import { RegisterOrderComponent } from './components/register-order/register-order.component';

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
        component: RegisterOrderComponent,
      },
      {
        path: '**',
        redirectTo: 'all',
      },
    ],
  },
];

export default orderRoutes;
