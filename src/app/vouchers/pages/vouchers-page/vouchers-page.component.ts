import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { VoucherListComponent } from '../../components/voucher-list/voucher-list.component';
import { VoucherService } from '../../services/voucher.service';
import { PaginationService } from '@src/app/shared/components/pagination/pagination.service';

@Component({
  selector: 'app-vouchers-page',
  imports: [VoucherListComponent],
  templateUrl: './vouchers-page.component.html',
})
export default class VouchersPageComponent {
  voucherService = inject(VoucherService);
  paginationService = inject(PaginationService);

  vouchersResource = rxResource({
    params: () => ({
      page: this.paginationService.currentPage(),
    }),

    stream: ({ params }) => {
      return this.voucherService.fetchVouchers({
        page: params.page,
      });
    },
  });
}
