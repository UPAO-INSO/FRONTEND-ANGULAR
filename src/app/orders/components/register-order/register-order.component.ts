import {
  Component,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { OrderProductsComponent } from './order-products/order-products.component';
import { OrderSummaryComponent } from './order-summary/order-summary.component';
import { ContentOrder, RequestOrder } from '../../interfaces/order.interface';

import { Table } from '@src/app/tables/interfaces/table.interface';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
import { ProductService } from '@src/app/products/services/product.service';
import { ConfirmModifyModalComponent } from '../confirm-modify-modal/confirm-modify-modal.component';

@Component({
  selector: 'app-register-order',
  imports: [
    OrderProductsComponent,
    OrderSummaryComponent,
    ConfirmModifyModalComponent,
  ],
  templateUrl: './register-order.component.html',
})
export class RegisterOrderComponent {
  private productService = inject(ProductService);

  selectedTable = input.required<Table>();
  modifyStatus = input<boolean>();
  activeOrder = input<ContentOrder | null>();

  orderCreated = output<RequestOrder>();
  orderUpdated = output<{ id: number; order: ContentOrder }>();
  closeModal = output<void>();
  statusModifyModalChange = output<boolean>();

  showCreateConfirmModal = signal<boolean>(false);
  pendingOrderData = signal<RequestOrder | ContentOrder | null>(null);

  orderSummary = viewChild(OrderSummaryComponent);

  productTypeResource = rxResource({
    stream: () => {
      return this.productService
        .fetchProductsType()
        .pipe(tap((productTypes) => productTypes));
    },
  });

  onCreateOrder(orderData: RequestOrder) {
    this.pendingOrderData.set(orderData);
    this.showCreateConfirmModal.set(true);
  }

  onUpdateOrder(id: number, order: RequestOrder) {
    this.pendingOrderData.set(order);
    this.showCreateConfirmModal.set(true);
  }

  confirmCreateOrder() {
    const orderData = this.pendingOrderData();
    const activeOrder = this.activeOrder();
    if (orderData) {
      if (activeOrder !== null && activeOrder !== undefined) {
        const order = {
          ...activeOrder,
          ...orderData,
        };

        this.orderUpdated.emit({
          id: this.activeOrder()?.id!,
          order: order as ContentOrder,
        });
      } else {
        this.orderCreated.emit(orderData as RequestOrder);
      }

      this.orderSummary()?.clearCart();

      this.pendingOrderData.set(null);
      this.showCreateConfirmModal.set(false);
      this.onCloseModal();
    }
  }

  cancelCreateOrder() {
    this.pendingOrderData.set(null);
    this.showCreateConfirmModal.set(false);
  }

  onCloseModal() {
    this.closeModal.emit();
    this.statusModifyModalChange.emit(false);
  }
}
