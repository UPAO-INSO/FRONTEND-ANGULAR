import { Routes } from '@angular/router';
import OrdersPageComponent from './pages/orders-page/orders-page.component';

export const orderRoutes: Routes = [
  { path: '', component: OrdersPageComponent },
  { path: '**', redirectTo: '' },
];

export default orderRoutes;
