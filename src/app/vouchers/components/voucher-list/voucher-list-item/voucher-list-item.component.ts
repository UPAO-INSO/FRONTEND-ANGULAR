import { Component, input } from '@angular/core';
import { Voucher } from '@src/app/vouchers/interfaces/voucher.interface';

@Component({
  selector: 'tr[app-voucher-list-item]',
  imports: [],
  templateUrl: './voucher-list-item.component.html',
})
export class VoucherListItemComponent {
  voucher = input.required<Voucher>();

  openPdf() {
    window.open(this.voucher().pdfUrl, '_blank');
  }

  copyLink() {
    navigator.clipboard.writeText(this.voucher().pdfUrl);
  }
}
