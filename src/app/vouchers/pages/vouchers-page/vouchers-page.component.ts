import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';

import { VoucherService } from '../../services/voucher.service';
import { PaginationService } from '@src/app/shared/components/pagination/pagination.service';
import { PaginationComponent } from '@src/app/shared/components/pagination/pagination.component';
import { PageHeaderComponent } from '@src/app/shared/components/page-header/page-header.component';
import { KpiCardComponent } from '@src/app/shared/components/kpi-card/kpi-card.component';
import { Voucher } from '../../interfaces/voucher.interface';

@Component({
  selector: 'app-vouchers-page',
  imports: [DatePipe, DecimalPipe, PaginationComponent, PageHeaderComponent, KpiCardComponent],
  templateUrl: './vouchers-page.component.html',
})
export default class VouchersPageComponent {
  private voucherService   = inject(VoucherService);
  readonly paginationService = inject(PaginationService);

  /** Voucher seleccionado para vista previa */
  previewVoucher = signal<Voucher | null>(null);
  /** Toast de confirmación de copia */
  copied = signal(false);

  vouchersResource = rxResource({
    params: () => ({ page: this.paginationService.currentPage() }),
    stream: ({ params }) => this.voucherService.fetchVouchers({ page: params.page }),
  });

  vouchers   = computed(() => this.vouchersResource.value()?.content ?? []);
  totalPages = computed(() => this.vouchersResource.value()?.totalPages ?? 1);
  totalItems = computed(() => this.vouchersResource.value()?.totalElements ?? 0);

  // ── Stats ────────────────────────────────────────────────────────
  totalBoletas  = computed(() => this.vouchers().filter(v => v.voucherType === 'RECEIPT').length);
  totalFacturas = computed(() => this.vouchers().filter(v => v.voucherType === 'INVOICE').length);
  totalMonto    = computed(() => this.vouchers().reduce((s, v) => s + (v.total ?? 0), 0));

  // ── Helpers ──────────────────────────────────────────────────────
  getVoucherLabel(v: Voucher): string {
    return v.voucherType === 'RECEIPT' ? 'Boleta' : 'Factura';
  }

  getSerieNumero(v: Voucher): string {
    return `${v.series ?? '—'}-${String(v.number ?? '').padStart(6, '0')}`;
  }

  openPdf(v: Voucher)  { window.open(v.pdfUrl,  '_blank'); }
  openXml(v: Voucher)  { window.open(v.xmlUrl,  '_blank'); }

  printVoucher(v: Voucher) {
    const win = window.open(v.pdfUrl, '_blank');
    if (win) {
      win.addEventListener('load', () => win.print(), { once: true });
    }
  }

  copyLink(v: Voucher) {
    navigator.clipboard.writeText(v.pdfUrl).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  openPreview(v: Voucher)  { this.previewVoucher.set(v); }
  closePreview()           { this.previewVoucher.set(null); }

  /** URL del QR generado vía goqr.me a partir del qrCodeString del comprobante */
  getQrUrl(v: Voucher): string {
    const data = encodeURIComponent(v.qrCodeString || v.pdfUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${data}`;
  }
}
