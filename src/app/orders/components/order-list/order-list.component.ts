import { Component, computed, input, output, signal } from '@angular/core';
import { ContentOrder, OrderStatus } from '../../interfaces/order.interface';
import { OrderListItemComponent } from './order-list-item/order-list-item.component';
import { OrderViewComponent } from '../order-view/order-view.component';
import { KitchenOrderStatus } from '@kitchen/interfaces/kitchen-order.interface';

@Component({
  selector: 'app-order-list',
  imports: [OrderListItemComponent, OrderViewComponent],
  templateUrl: './order-list.component.html',
})
export class OrderListComponent {
  orders = input.required<ContentOrder[]>({});

  isEmpty = input<boolean>(false);
  isLoading = input<boolean>(false);
  errorMessage = input<string | unknown | null>();

  selectedOrder = signal<ContentOrder | null>(null);

  statusChange = output<{
    orderId: number;
    newStatus: OrderStatus | KitchenOrderStatus;
  }>();

  onChangeStatus(orderId: number, newStatus: OrderStatus | KitchenOrderStatus) {
    this.statusChange.emit({ orderId, newStatus });
  }

  openViewOrder(order: ContentOrder) {
    this.selectedOrder.set(order);
  }

  closeViewOrder() {
    this.selectedOrder.set(null);
  }

  displayState = computed(() => {
    if (this.isLoading()) return 'loading';
    if (this.errorMessage()) return 'error';
    if (this.orders().length > 0) return 'success';
    return 'empty';
  });
}
