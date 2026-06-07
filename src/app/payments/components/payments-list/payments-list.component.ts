import { Component, computed, signal, input, output } from '@angular/core';
import {
  ContentPayment,
  PaymentType,
} from '../../interfaces/payments.inteface';
import { PaginationComponent } from '@src/app/shared/components/pagination/pagination.component';
import { PageHeaderComponent } from '@src/app/shared/components/page-header/page-header.component';
import { KpiCardComponent } from '@src/app/shared/components/kpi-card/kpi-card.component';
import { PaymentListItemComponent } from './payment-list-item/payment-list-item.component';
import { PaymentViewComponent } from '../payment-view/payment-view.component';
import { CreateVoucherModalComponent } from '../create-voucher-modal/create-voucher-modal.component';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-payments-list',
  imports: [
    PaginationComponent,
    PageHeaderComponent,
    KpiCardComponent,
    PaymentListItemComponent,
    PaymentViewComponent,
    CreateVoucherModalComponent,
    DecimalPipe,
  ],
  templateUrl: './payments-list.component.html',
})
export class PaymentsListComponent {
  searchQuery  = signal<string>('');
  currentPage  = input<number>(1);
  totalPages   = input<number>(1);
  totalElements = input<number>(0);

  payments = input.required<ContentPayment[]>();

  // ── KPI computed ──────────────────────────────────────────────────
  paidCount    = computed(() => this.payments().filter(p => p.state === 'paid').length);
  pendingCount = computed(() => this.payments().filter(p => p.state === 'pending').length);
  totalMonto   = computed(() =>
    this.payments()
      .filter(p => p.state === 'paid')
      .reduce((s, p) => s + (p.amount / 100), 0)
  );
  walletCount  = computed(() =>
    this.payments().filter(p => p.paymentType === PaymentType.MOBILE_WALLET).length
  );
  cashCount    = computed(() =>
    this.payments().filter(p => p.paymentType === PaymentType.CASH).length
  );

  statusChange = output<string | null>();
  paymentTypeChange = output<PaymentType | null>();

  selectedPayment = signal<ContentPayment | null>(null);
  isModalOpen = signal<boolean>(false);
  selectedPaymentForVoucher = signal<ContentPayment | null>(null);
  isVoucherModalOpen = signal<boolean>(false);

  onViewPaymentDetails(payment: ContentPayment) {
    this.selectedPayment.set(payment);
    this.isModalOpen.set(true);
  }

  onCloseModal() {
    this.isModalOpen.set(false);
    this.selectedPayment.set(null);
  }

  onCreateVoucher(payment: ContentPayment) {
    this.selectedPaymentForVoucher.set(payment);
    this.isVoucherModalOpen.set(true);
  }

  onCloseVoucherModal() {
    this.isVoucherModalOpen.set(false);
    this.selectedPaymentForVoucher.set(null);
  }

  onVoucherCreated() {
    // Puedes agregar lógica para refrescar la lista o mostrar notificación
    console.log('Comprobante creado exitosamente');
  }

  onStatusFilterChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;

    if (value === 'all') {
      this.statusChange.emit(null);
    } else {
      this.statusChange.emit(value);
    }
  }

  onPaymentTypeFilterChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;

    if (value === 'all') {
      this.paymentTypeChange.emit(null);
    } else {
      this.paymentTypeChange.emit(value.toUpperCase() as PaymentType);
    }
  }
}
