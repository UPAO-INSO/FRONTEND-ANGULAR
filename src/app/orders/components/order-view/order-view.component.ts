import { Component, effect, inject, input, output, signal } from '@angular/core';
import {
  ContentOrder,
  OrderStatus,
  UUID,
} from '../../interfaces/order.interface';
import {
  ORDER_STATUS_BG_CLASS,
  ORDER_STATUS_LABELS,
} from '@src/app/shared/utils/order-status.utils';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Table } from '@src/app/tables/interfaces/table.interface';
import {
  CreateCulqiOrder,
  RESTCulqiOrder,
} from '@src/app/shared/interfaces/culqi.interface';
import { CulqiService } from '@src/app/shared/services/culqi.service';
import { PaymentsService } from '@src/app/payments/services/payments.service';
import { ContentPayment } from '@src/app/payments/interfaces/payments.inteface';
import { ConfirmModifyModalComponent } from '../confirm-modify-modal/confirm-modify-modal.component';
import { ConfirmStatusModalComponent } from '../confirm-status-modal/confirm-status-modal.component';
import { PaymentCheckoutComponent } from '@src/app/payments/components/payment-checkout/payment-checkout.component';
import { StatusBadgeComponent } from '@src/app/shared/components/status-badge/status-badge.component';

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
    ConfirmModifyModalComponent,
    ConfirmStatusModalComponent,
    PaymentCheckoutComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './order-view.component.html',
})
export class OrderViewComponent {
  private culqiService    = inject(CulqiService);
  private paymentsService = inject(PaymentsService);
  private router          = inject(Router);

  selectedTable    = input<Table | null>();
  activeOrder      = input.required<ContentOrder>();
  isAtm            = input.required<boolean>();
  textConfirm      = input.required<string>();
  changeStatusQuery = input.required<OrderStatus>();

  statusChange             = output<StatusChange>();
  statusModifyModalChange  = output<boolean>();
  closeModal               = output<void>();
  paymentSuccess           = output<PaymentSuccessData>();

  readonly orderStatus = OrderStatus;

  showConfirmModal       = signal<boolean>(false);
  showConfirmModifyModal = signal<boolean>(false);
  showPaymentModal       = signal<boolean>(false);

  culqiOrder   = signal<RESTCulqiOrder | null>(null);
  existingPayment = signal<ContentPayment | null>(null);
  checkingPayment = signal<boolean>(false);

  paymentData = signal<CreateCulqiOrder>({
    amount:          0,
    description:     '',
    orderNumber:     '',
    confirm:         true,
    currencyIsoCode: 'PEN',
    expirationDate:  '',
    clientDetailsRequest: { first_name: '', last_name: '', email: '', phone_number: '' },
    metadata: { customer_id: 0 },
  });

  constructor() {
    // Al cambiar la orden activa, buscar si ya tiene un pago registrado
    effect(() => {
      const order = this.activeOrder();
      if (!order?.id) return;

      // Si ya está PAID, seguro tiene pago — lo buscamos para mostrar enlace
      if (order.orderStatus === OrderStatus.PAID || this.canProcessPayment()) {
        this.checkingPayment.set(true);
        this.paymentsService.getPaymentByOrderId(order.id).subscribe({
          next: (payment) => {
            this.existingPayment.set(payment);
            this.checkingPayment.set(false);
          },
          error: () => this.checkingPayment.set(false),
        });
      }
    });
  }

  // ── Acciones ──────────────────────────────────────────────────────

  onStatusConfirmModifyModalChange() { this.showConfirmModifyModal.set(true); }
  cancelConfirmModifyModalChange()   { this.showConfirmModifyModal.set(false); }
  onStatusChange()                   { this.showConfirmModal.set(true); }
  cancelStatusChange()               { this.showConfirmModal.set(false); }

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

  onCloseModal() { this.closeModal.emit(); }

  openPayment() {
    const order = this.activeOrder();
    const existingCulqiOrder = this.culqiService.getCulqiOrder(order.id);

    if (existingCulqiOrder) {
      this.culqiOrder.set(existingCulqiOrder);
      this.showPaymentModal.set(true);
      return;
    }

    const expirationInSeconds = Math.floor((Date.now() + 10 * 60 * 1000) / 1000);
    this.paymentData.set({
      amount:          this.calcTotal(),
      description:     `Orden ${order.id} - Mesa ${order.tableId}`,
      orderNumber:     order.id.toString(),
      confirm:         true,
      currencyIsoCode: 'PEN',
      expirationDate:  expirationInSeconds.toString(),
      clientDetailsRequest: { first_name: '', last_name: '', email: '', phone_number: '' },
      metadata: { customer_id: 0 },
    });
    this.showPaymentModal.set(true);
  }

  /** Navega a la página de pagos (filtra por el ID del pago existente) */
  viewExistingPayment() {
    this.closeModal.emit();
    this.router.navigate(['/payments']);
  }

  onPaymentSuccess(culqiOrder: RESTCulqiOrder) {
    this.culqiOrder.set(culqiOrder);
    this.paymentSuccess.emit({ orderId: this.activeOrder().id, chargeId: culqiOrder.id });
    // Recargar el pago existente después de procesar
    this.paymentsService.getPaymentByOrderId(this.activeOrder().id).subscribe(
      (payment) => this.existingPayment.set(payment)
    );
  }

  onPaymentError(error: any) { console.error('Error en el pago:', error); }
  onPaymentCancel()          { this.showPaymentModal.set(false); }

  resetPayment() {
    this.showPaymentModal.set(false);
    this.culqiService.removeCulqiOrder(this.activeOrder().id);
    this.culqiOrder.set(null);
  }

  // ── Cálculos ──────────────────────────────────────────────────────

  calcSubtotal(): number { return this.activeOrder()?.totalPrice!; }

  calcTax(): number {
    return parseFloat((this.calcSubtotal() * 0.18).toFixed(2));
  }

  calcTotal(): number { return this.calcSubtotal() + this.calcTax(); }

  canProcessPayment(): boolean {
    const status = this.activeOrder().orderStatus;
    return status === OrderStatus.READY || status === OrderStatus.COMPLETED;
  }

  getOrderAmPm(order: ContentOrder): string {
    if (!order?.createdAt) return '';
    return new Date(order.createdAt).getHours() >= 12 ? 'PM' : 'AM';
  }

  getColorOrderInTableStatus(order: ContentOrder): string {
    return ORDER_STATUS_BG_CLASS[order.orderStatus] ?? '';
  }

  getOrderStatusText(order: ContentOrder): string {
    return ORDER_STATUS_LABELS[order.orderStatus] ?? '';
  }
}
