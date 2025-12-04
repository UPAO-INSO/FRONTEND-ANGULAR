import { Component, input } from '@angular/core';
import { Voucher } from '../../interfaces/voucher.interface';
import { VoucherListItemComponent } from './voucher-list-item/voucher-list-item.component';
import { PaginationComponent } from '@src/app/shared/components/pagination/pagination.component';

@Component({
  selector: 'app-voucher-list',
  imports: [VoucherListItemComponent, PaginationComponent],
  templateUrl: './voucher-list.component.html',
})
export class VoucherListComponent {
  vouchers = input.required<Voucher[]>();
  currentPage = input<number>(1);
  totalPages = input<number>(1);

  openPdf(url: string) {
    window.open(url, '_blank');
  }
}
