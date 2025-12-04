import { Routes } from '@angular/router';
import VoucherLayoutComponent from './layouts/voucher-layout/voucher-layout.component';
import VouchersPageComponent from './pages/vouchers-page/vouchers-page.component';

export const voucherRoutes: Routes = [
  {
    path: '',
    component: VoucherLayoutComponent,
    children: [
      {
        path: '',
        component: VouchersPageComponent,
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];

export default voucherRoutes;
