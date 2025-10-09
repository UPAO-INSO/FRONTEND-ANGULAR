import { Component, input, output, signal, viewChild } from '@angular/core';
import { OrderProductsComponent } from './order-products/order-products.component';
import { OrderSummaryComponent } from './order-summary/order-summary.component';
import { Table } from 'src/app/tables/interfaces/table.interface';
import { ProductType } from 'src/app/products/interfaces/product.type';
import { RequestOrder } from '../../interfaces/order.interface';

@Component({
  selector: 'app-register-order',
  imports: [OrderProductsComponent, OrderSummaryComponent],
  templateUrl: './register-order.component.html',
})
export class RegisterOrderComponent {
  selectedTable = input<Table | null>();
  productTypes = input.required<ProductType[]>({});

  orderCreated = output<RequestOrder>();

  closeModal = output<void>();
  nameProductQuery = output<string>();

  showCreateConfirmModal = signal<boolean>(false);
  pendingOrderData = signal<RequestOrder | null>(null);

  orderSummary = viewChild(OrderSummaryComponent);

  nameProductValue(name: string) {
    return this.nameProductQuery.emit(name);
  }

  onCreateOrder(orderData: RequestOrder) {
    this.pendingOrderData.set(orderData);
    this.showCreateConfirmModal.set(true);
  }

  confirmCreateOrder() {
    const orderData = this.pendingOrderData();
    if (orderData) {
      this.orderCreated.emit(orderData);

      this.orderSummary()?.clearCart();

      this.pendingOrderData.set(null);
      this.showCreateConfirmModal.set(false);
      this.closeModal.emit();
    }
  }

  cancelCreateOrder() {
    this.pendingOrderData.set(null);
    this.showCreateConfirmModal.set(false);
  }

  onCloseModal() {
    this.closeModal.emit();
  }
}
