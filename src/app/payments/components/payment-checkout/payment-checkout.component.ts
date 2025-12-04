import {
  Component,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CulqiService } from '@shared/services/culqi.service';
import { ClientSelectorComponent } from '@src/app/clients/components/client-selector/client-selector.component';
import { Client } from '@src/app/clients/interfaces/client.interface';
import { filter, Subscription, timeInterval } from 'rxjs';
import {
  CreateCulqiOrder,
  RESTCulqiOrder,
  RESTChangeStatusCulqiOrder,
  ClientDetailsRequest,
} from '@src/app/shared/interfaces/culqi.interface';
import { WebSocketService } from '@src/app/shared/services/websocket.service';
import {
  CreatePaymentRequest,
  PaymentType,
} from '../../interfaces/payments.inteface';
import { ContentOrder } from '@src/app/orders/interfaces/order.interface';
import { PaymentsService } from '../../services/payments.service';

@Component({
  selector: 'app-payment-checkout',
  imports: [CommonModule, ClientSelectorComponent],
  templateUrl: './payment-checkout.component.html',
})
export class PaymentCheckoutComponent {
  private culqiService = inject(CulqiService);
  private websocketService = inject(WebSocketService);
  private paymentService = inject(PaymentsService);
  private wsSubscription?: Subscription;

  order = input.required<ContentOrder>();
  isOpen = input.required<boolean>();
  paymentRequest = input.required<CreateCulqiOrder>();
  existingOrder = input<RESTCulqiOrder | null>(null);

  paymentSuccess = output<RESTCulqiOrder>();
  paymentError = output<any>();
  cancel = output<void>();

  clientSelector = viewChild<ClientSelectorComponent>('clientSelector');

  isProcessing = signal<boolean>(false);
  errorMessage = signal<string>('');
  selectedPaymentMethod = signal<string>('mobile_wallet');
  selectedClient = signal<Client | null>(null);

  qrResponse = signal<RESTCulqiOrder | null>(null);
  showQrModal = signal<boolean>(false);
  showCopyToast = signal<boolean>(false);

  paymentStatus = signal<string>('pending');
  isListeningForPayment = signal<boolean>(false);
  showPaymentSuccessModal = signal<boolean>(false);

  constructor() {
    effect(() => {
      const isOpen = this.isOpen();
      const existingOrder = this.existingOrder();

      if (isOpen && existingOrder) {
        this.qrResponse.set(existingOrder);
        this.showQrModal.set(true);
        console.log('showQrModal true', this.showQrModal());

        this.paymentStatus.set(existingOrder.state || 'pending');
        this.subscribeToOrderUpdates(existingOrder.id);
        return;
      }

      if (!isOpen) {
        this.showQrModal.set(false);
        this.showPaymentSuccessModal.set(false);
        this.qrResponse.set(null);
        this.isListeningForPayment.set(false);

        if (this.wsSubscription) {
          this.wsSubscription.unsubscribe();
          this.wsSubscription = undefined;
        }
      }
    });
  }

  private subscribeToOrderUpdates(culqiOrderId: string) {
    if (this.wsSubscription) {
      console.log('unsubscribe');
      this.wsSubscription.unsubscribe();
    }

    this.isListeningForPayment.set(true);
    console.log('Listening for payment updates for order:', culqiOrderId);

    this.wsSubscription = this.websocketService.culqiOrderUpdates$
      .pipe(
        filter(
          (update): update is RESTChangeStatusCulqiOrder =>
            !!update && update.id === culqiOrderId
        )
      )
      .subscribe({
        next: (update) => {
          console.log('Payment update received:', update);
          this.handlePaymentUpdate(update);
        },
        error: (error) => {
          console.error('WebSocket subscription error:', error);
          this.isListeningForPayment.set(false);
        },
      });
  }

  private handlePaymentUpdate(update: RESTChangeStatusCulqiOrder) {
    const status = update.state;
    this.paymentStatus.set(status);

    switch (status.toLowerCase()) {
      case 'paid':
        console.log('Payment confirmed!');
        this.onPaymentConfirmed(update);
        break;

      case 'expired':
        console.log('Payment expired');
        this.errorMessage.set('El código de pago ha expirado');
        break;

      case 'cancelled':
        console.log('Payment cancelled');
        this.errorMessage.set('El pago fue cancelado');
        break;

      default:
        console.log('Payment status:', status);
    }
  }

  private onPaymentConfirmed(update: RESTChangeStatusCulqiOrder) {
    const currentOrder = this.qrResponse();

    if (currentOrder) {
      const updatedOrder: RESTCulqiOrder = {
        ...currentOrder,
        state: update.state,
        paid_at: update.paid_at,
        updated_at: update.updated_at,
      };

      this.qrResponse.set(updatedOrder);
      this.paymentSuccess.emit(updatedOrder);
      this.isListeningForPayment.set(false);
      this.showPaymentSuccessModal.set(true);
    }
  }

  closePaymentSuccessModal() {
    this.showPaymentSuccessModal.set(false);
    this.closeQrModal();
  }

  onClientSelectorCancel() {}

  onSelectPaymentMethod(method: any) {
    this.selectedPaymentMethod.set(method);
  }

  onOpenClientSelector() {
    this.clientSelector()?.open();
  }

  onClientSelected(client: Client) {
    this.selectedClient.set(client);
    this.errorMessage.set('');
  }

  getCustomerInfo(): ClientDetailsRequest {
    const client = this.selectedClient();
    if (!client) {
      return this.paymentRequest().clientDetailsRequest;
    }

    return {
      first_name: client.name,
      last_name: client.lastname,
      phone_number: client.phone,
      email: client.email,
    };
  }

  onPayWithCash() {
    const order = this.order();
    const now = new Date().toISOString();
    const payment: CreatePaymentRequest = {
      provider: 'system',
      externalId: '',
      amount: order.totalPrice,
      currencyCode: 'PEN',
      description: `Order ${order.id} - Mesa ${order.tableId}`,
      orderId: order.id,
      customerId: this.selectedClient()?.id || 0,
      paymentType: PaymentType.CASH,
      state: 'paid',
      qr: '',
      urlPe: '',
      creationDate: now,
      expirationDate: now,
      updatedAt: now,
      paidAt: now,
      rawResponse: '',
    };
    const customerInfo = this.getCustomerInfo();

    if (!customerInfo) {
      this.errorMessage.set(
        'Selecciona un cliente o proporciona información del cliente'
      );
      return;
    }

    this.isProcessing.set(true);
    this.onProcessPaymentCash(payment);
    this.errorMessage.set('');
  }

  onPayWithWallet() {
    const request = this.paymentRequest();
    const customerInfo = this.getCustomerInfo();

    if (!customerInfo) {
      this.errorMessage.set(
        'Selecciona un cliente o proporciona información del cliente'
      );
      return;
    }

    const amountInCents = request.amount * 100;

    if (amountInCents < 600) {
      this.errorMessage.set(
        'El monto mínimo para billeteras móviles es S/ 6.00'
      );
      return;
    }

    if (amountInCents > 50000) {
      this.errorMessage.set(
        'El monto máximo para billeteras móviles es S/ 500.00'
      );
      return;
    }

    this.isProcessing.set(true);
    this.onProcessPaymentWallet(request, customerInfo, amountInCents);
    this.errorMessage.set('');
  }

  onProcessPaymentCash(payment: CreatePaymentRequest) {
    this.paymentService.createPayment(payment).subscribe({
      next: () => {
        this.isProcessing.set(false);
      },
      error: (error) => {
        console.error('Error al crear orden:', error);
        this.isProcessing.set(false);
        this.errorMessage.set('Error al crear orden de pago');
        this.paymentError.emit(error);
      },
    });
  }

  onProcessPaymentWallet(
    request: CreateCulqiOrder,
    customerInfo: ClientDetailsRequest,
    amountInCents: number
  ) {
    const orderRequest = {
      ...request,
      clientDetailsRequest: customerInfo,
      amount: amountInCents,
      metadata: {
        customer_id: this.selectedClient()?.id || 0,
      },
    };

    console.log({ orderRequest });

    this.culqiService.createCulqiOrder(orderRequest).subscribe({
      next: (response) => {
        console.log('Orden creada exitosamente:', response);
        this.isProcessing.set(false);
        this.qrResponse.set(response);
        this.showQrModal.set(true);
        this.subscribeToOrderUpdates(response.id);
        this.paymentSuccess.emit(response);
      },
      error: (error) => {
        console.error('Error al crear orden:', error);
        this.isProcessing.set(false);
        this.errorMessage.set(error?.message || 'Error al crear orden de pago');
        this.paymentError.emit(error);
      },
    });
  }

  closeQrModal() {
    this.showQrModal.set(false);
    this.qrResponse.set(null);
    this.isListeningForPayment.set(false);

    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
      this.wsSubscription = undefined;
    }

    this.cancel.emit();
  }

  copyPaymentCode() {
    const code = this.qrResponse()?.payment_code;
    if (code) {
      navigator.clipboard.writeText(code);
      this.showCopyToast.set(true);
      setTimeout(() => {
        this.showCopyToast.set(false);
      }, 1000);
    }
  }

  onPay() {
    const method = this.selectedPaymentMethod();
    if (method === 'mobile_wallet') {
      this.onPayWithWallet();
    } else {
      this.onPayWithCash();
    }
  }

  onCancel() {
    this.showQrModal.set(false);
    this.cancel.emit();
  }

  openExistingQr() {
    const order = this.existingOrder();
    console.log('exist order', { order });
    if (!order) return;

    this.qrResponse.set(order);
    this.showQrModal.set(true);
    this.paymentStatus.set(order.state || 'pending');
    this.subscribeToOrderUpdates(order.id);
  }

  formatAmount(amount: number): string {
    return `S/ ${(amount / 100).toFixed(2)}`;
  }

  getClientFullName(): string {
    const client = this.selectedClient();
    if (!client) return '';
    return `${client.name} ${client.lastname}`;
  }
}
