import { Component, signal, input, output } from '@angular/core';
import {
  ContentPayment,
  PaymentType,
} from '../../interfaces/payments.inteface';
import { PaginationComponent } from '@src/app/shared/components/pagination/pagination.component';
import { PaymentListItemComponent } from './payment-list-item/payment-list-item.component';
import { PaymentViewComponent } from '../payment-view/payment-view.component';

@Component({
  selector: 'app-payments-list',
  imports: [
    PaginationComponent,
    PaymentListItemComponent,
    PaymentViewComponent,
  ],
  templateUrl: './payments-list.component.html',
})
export class PaymentsListComponent {
  searchQuery = signal<string>('');
  currentPage = input<number>(1);
  totalPages = input<number>(1);

  payments = input.required<ContentPayment[]>();

  statusChange = output<string | null>();
  paymentTypeChange = output<PaymentType | null>();

  selectedPayment = signal<ContentPayment | null>(null);
  isModalOpen = signal<boolean>(false);

  onViewPaymentDetails(payment: ContentPayment) {
    this.selectedPayment.set(payment);
    this.isModalOpen.set(true);
  }

  onCloseModal() {
    this.isModalOpen.set(false);
    this.selectedPayment.set(null);
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
