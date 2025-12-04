import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import {
  ContentPayment,
  PaymentType,
} from '@src/app/payments/interfaces/payments.inteface';

@Component({
  selector: 'tr[app-payment-list-item]',
  imports: [DatePipe, CurrencyPipe],
  templateUrl: './payment-list-item.component.html',
})
export class PaymentListItemComponent {
  payment = input.required<ContentPayment>();

  viewDetails = output<ContentPayment>();

  paymentType = PaymentType;

  getPaymentTypeText(payment: PaymentType) {
    switch (payment) {
      case PaymentType.MOBILE_WALLET:
        return 'Billetera Digital';
      case PaymentType.CASH:
        return 'Efectivo';
      default:
        return payment;
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'paid':
        return 'Pagado';
      case 'pending':
        return 'Pendiente';
      default:
        return status;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      default:
        return 'badge-ghost';
    }
  }

  formatAmount(amountInCents: number): string {
    const amountInSoles = amountInCents / 100;
    return amountInSoles.toFixed(2);
  }

  openPaymentDetails() {
    this.viewDetails.emit(this.payment());
  }
}
