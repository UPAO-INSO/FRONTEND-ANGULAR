import { Component, inject, input, output, signal } from '@angular/core';
import {
  ContentOrder,
  OrderStatus,
  UUID,
} from '../../interfaces/order.interface';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { PaymentCheckoutComponent } from '@shared/components/payment-checkout/payment-checkout.component';
import { Table } from '@src/app/tables/interfaces/table.interface';
import {
  CreateCulqiOrder,
  RESTCulqiOrder,
} from '@src/app/shared/interfaces/culqi.interface';
import { CulqiService } from '@src/app/shared/services/culqi.service';
import { ConfirmModifyModalComponent } from '../confirm-modify-modal/confirm-modify-modal.component';
import { ConfirmStatusModalComponent } from '../confirm-status-modal/confirm-status-modal.component';

interface PaymentSuccessData {
  orderId: UUID;
  chargeId: string;
}

interface StatusChange {
  orderId: UUID;
  newStatus: OrderStatus;
}

@Component({
  selector: 'app-order-view',
  imports: [
    TitleCasePipe,
    DatePipe,
    PaymentCheckoutComponent,
    ConfirmModifyModalComponent,
    ConfirmStatusModalComponent,
  ],
  templateUrl: './order-view.component.html',
})
export class OrderViewComponent {
  private culqiService = inject(CulqiService);

  selectedTable = input<Table | null>();
  activeOrder = input.required<ContentOrder>();
  isAtm = input.required<boolean>();
  textConfirm = input.required<string>();
  changeStatusQuery = input.required<OrderStatus>();

  statusChange = output<StatusChange>();
  statusModifyModalChange = output<boolean>();

  orderStatus = OrderStatus;

  closeModal = output<void>();

  showConfirmModal = signal<boolean>(false);
  showConfirmModifyModal = signal<boolean>(false);
  showPaymentModal = signal<boolean>(false);

  culqiOrder = signal<RESTCulqiOrder | null>(null);

  paymentData = signal<CreateCulqiOrder>({
    amount: 0,
    description: '',
    orderNumber: '',
    confirm: true,
    currencyIsoCode: 'PEN',
    expirationDate: '',
    clientDetailsRequest: {
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
    },
  });

  paymentSuccess = output<PaymentSuccessData>();

  onStatusConfirmModifyModalChange() {
    this.showConfirmModifyModal.set(true);
  }

  cancelConfirmModifyModalChange() {
    this.showConfirmModifyModal.set(false);
  }

  onStatusChange() {
    this.showConfirmModal.set(true);
  }

  confirmStatusModifyModalChange(status: boolean) {
    this.showConfirmModifyModal.set(false);
    this.statusModifyModalChange.emit(status);
  }

  confirmStatusChange(status: OrderStatus) {
    const orderId = this.activeOrder()?.id;
    if (orderId) {
      this.statusChange.emit({ orderId, newStatus: status });
      this.showConfirmModal.set(false);
      this.closeModal.emit();
    }
  }

  cancelStatusChange() {
    this.showConfirmModal.set(false);
  }

  onCloseModal() {
    this.closeModal.emit();
  }

  calcSubtotal(): number {
    return this.activeOrder()?.totalPrice!;
  }

  calcTax(): number {
    const subtotal = this.calcSubtotal();
    const taxRate = 0.18;
    return parseFloat((subtotal * taxRate).toFixed(2));
  }

  calcTotal(): number {
    return this.calcSubtotal() + this.calcTax();
  }

  getOrderAmPm(order: ContentOrder) {
    if (!order || !order.createdAt) return '';

    const date = new Date(order.createdAt);
    const hours = date.getHours();

    return hours >= 12 ? 'PM' : 'AM';
  }

  getColorOrderInTableStatus(order: ContentOrder) {
    const status = order.orderStatus;

    const STATUS: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.PENDING]: 'bg-status-pending',
      [OrderStatus.PREPARING]: 'bg-status-preparing',
      [OrderStatus.READY]: 'bg-status-ready',
      [OrderStatus.PAID]: 'bg-status-paid',
      [OrderStatus.COMPLETED]: 'bg-status-completed',
      [OrderStatus.CANCELLED]: 'bg-status-cancelled',
    };

    return STATUS[status];
  }

  openPayment() {
    const order = this.activeOrder();

    console.log({ order });

    const existingOrder = this.culqiService.getCulqiOrder(order.id);

    if (existingOrder) {
      this.culqiOrder.set(existingOrder);
      this.showPaymentModal.set(true);
      return;
    }

    const expirationInSeconds = Math.floor(
      (Date.now() + 10 * 60 * 1000) / 1000
    );

    this.paymentData.set({
      amount: this.calcTotal(),
      description: `Orden ${order.id} - Mesa ${this.activeOrder().tableId}`,
      orderNumber: order.id.toString(),
      confirm: true,
      currencyIsoCode: 'PEN',
      expirationDate: expirationInSeconds.toString(),
      clientDetailsRequest: {
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
      },
    });
    this.showPaymentModal.set(true);
  }

  onPaymentSuccess(culqiOrder: RESTCulqiOrder) {
    this.culqiOrder.set(culqiOrder);

    this.paymentSuccess.emit({
      orderId: this.activeOrder().id,
      chargeId: culqiOrder.id,
    });
  }

  onPaymentError(error: any) {
    console.error('Error en el pago:', error);
  }

  onPaymentCancel() {
    this.showPaymentModal.set(false);
  }

  resetPayment() {
    this.showPaymentModal.set(false);
    const orderId = this.activeOrder().id;

    this.culqiService.removeCulqiOrder(orderId);

    this.culqiOrder.set(null);
    this.showPaymentModal.set(false);
  }

  canProcessPayment(): boolean {
    const status = this.activeOrder().orderStatus;
    return status === OrderStatus.READY || status === OrderStatus.COMPLETED;
  }

  getOrderStatusText(order: ContentOrder) {
    const status = order.orderStatus;

    const STATUS: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.PENDING]: 'Pendiente',
      [OrderStatus.PREPARING]: 'Preparando',
      [OrderStatus.READY]: 'Listo',
      [OrderStatus.PAID]: 'Pagado',
      [OrderStatus.COMPLETED]: 'Completado',
      [OrderStatus.CANCELLED]: 'Cancelado',
    };

    return STATUS[status];
  }
}
