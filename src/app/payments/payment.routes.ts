import { Routes } from '@angular/router';
import { PaymentsPageComponent } from './pages/payments-page/payments-page.component';

export const paymentRoutes: Routes = [
  { path: '', component: PaymentsPageComponent },
  { path: '**', redirectTo: '' },
];

export default paymentRoutes;
