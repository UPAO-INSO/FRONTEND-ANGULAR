import { Routes } from '@angular/router';
import VouchersPageComponent from './pages/vouchers-page/vouchers-page.component';

export const voucherRoutes: Routes = [
  { path: '', component: VouchersPageComponent },
  { path: '**', redirectTo: '' },
];

export default voucherRoutes;
