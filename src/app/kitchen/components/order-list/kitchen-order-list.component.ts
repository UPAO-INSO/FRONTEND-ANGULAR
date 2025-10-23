import { Component, computed, input, output } from '@angular/core';

import { OrderCardComponent } from '../order-card/order-card.component';

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

  statusChange = output<{ orderId: number; newStatus: OrderStatus }>();
  refresh = output<void>();

  filteredOrders = computed(() => {
    const filtered = this.orders().filter(
      (order) =>
        order.orderStatus === OrderStatus.PENDING ||
        order.orderStatus === OrderStatus.PREPARING ||
        order.orderStatus === OrderStatus.READY
    );

    const readyOrders = filtered.filter(
      (order) => order.orderStatus === OrderStatus.READY
    );

    const nonReadyOrders = filtered.filter(
      (order) => order.orderStatus !== OrderStatus.READY
    );

    const sortedNonReady = nonReadyOrders.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    const sortedReady = readyOrders.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    return [...sortedNonReady, ...sortedReady];
  });

  onStatusChange(orderId: number, newStatus: OrderStatus) {
    this.statusChange.emit({ orderId, newStatus });
  }

  onRefresh() {
    this.refresh.emit();
  }
}
