import { Component, input, output, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import {
  ContentPayment,
  PaymentType,
} from '../../interfaces/payments.inteface';

@Component({
  selector: 'app-payment-view',
  imports: [CommonModule, DatePipe, CurrencyPipe],
  templateUrl: './payment-view.component.html',
})
export class PaymentViewComponent {
  payment = input.required<ContentPayment>();
  isOpen = input.required<boolean>();

  close = output<void>();

  paymentType = PaymentType;

  onClose() {
    this.close.emit();
  }

  getPaymentTypeText(type: PaymentType): string {
    switch (type) {
      case PaymentType.MOBILE_WALLET:
        return 'Billetera Digital';
      case PaymentType.CASH:
        return 'Efectivo';
      default:
        return type;
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'paid':
        return 'Pagado';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelado';
      case 'expired':
        return 'Expirado';
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
      case 'cancelled':
      case 'expired':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  }

  formatAmount(amountInCents: number): number {
    const amountInSoles = amountInCents / 100;
    return parseFloat(amountInSoles.toFixed(2));
  }
}
