import { Routes } from '@angular/router';
import { PaymentLayoutComponent } from './layouts/payment-layout/payment-layout.component';
import { PaymentsPageComponent } from './pages/payments-page/payments-page.component';

export const orderRoutes: Routes = [
  {
    path: '',
    component: PaymentLayoutComponent,
    children: [
      {
        path: '',
        component: PaymentsPageComponent,
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];

export default orderRoutes;
