import { Component, computed, input, output } from '@angular/core';

import {
  OrderCardComponent,
  ServedProductOrder,
} from '../order-card/order-card.component';

import {
  ContentOrder,
  OrderStatus,
  UUID,
} from '@orders/interfaces/order.interface';

export interface StatusChange {
  orderId: UUID;
  newStatus: OrderStatus;
}

@Component({
  selector: 'app-kitchen-order-list',
  imports: [OrderCardComponent],
  templateUrl: './kitchen-order-list.component.html',
})
export class KitchenOrderListComponent {
  orders = input.required<ContentOrder[]>();
  isLoading = input<boolean>(false);
  error = input<Error | undefined>();

  statusChange = output<StatusChange>();
  servedProductOrder = output<ServedProductOrder>();
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

  onStatusChange(orderId: UUID, newStatus: OrderStatus) {
    this.statusChange.emit({ orderId, newStatus });
  }

  onRefresh() {
    this.refresh.emit();
  }

  onServedProductOrder(served: ServedProductOrder) {
    this.servedProductOrder.emit(served);
  }
}
