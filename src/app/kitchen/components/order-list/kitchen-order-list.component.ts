import { Component, input, output } from '@angular/core';

import { OrderCardComponent } from '../order-card/order-card.component';

import { KitchenOrderStatus } from '../../interfaces/kitchen-order.interface';
import { ContentOrder, OrderStatus } from '@orders/interfaces/order.interface';

@Component({
  selector: 'app-kitchen-order-list',
  imports: [OrderCardComponent],
  templateUrl: './kitchen-order-list.component.html',
})
export class KitchenOrderListComponent {
  orders = input.required<ContentOrder[]>();
  isLoading = input<boolean>(false);
  error = input<Error | undefined>();

  statusChange = output<{ orderId: number; newStatus: KitchenOrderStatus }>();
  refresh = output<void>();

  filterOrders() {
    console.log({ orders: this.orders() });

    const filter = this.orders().filter(
      (order) =>
        order.orderStatus === KitchenOrderStatus.PENDING ||
        order.orderStatus === KitchenOrderStatus.PREPARING ||
        order.orderStatus === KitchenOrderStatus.READY ||
        order.orderStatus === OrderStatus.PENDING ||
        order.orderStatus === OrderStatus.PREPARING ||
        order.orderStatus === OrderStatus.READY
    );

    console.log({ filter });

    return filter;
  }

  onStatusChange(orderId: number, newStatus: KitchenOrderStatus) {
    this.statusChange.emit({ orderId, newStatus });
  }

  onRefresh() {
    this.refresh.emit();
  }
}
