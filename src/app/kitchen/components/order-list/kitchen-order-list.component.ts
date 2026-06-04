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
import { ListStateComponent } from '@src/app/shared/components/list-state/list-state.component';

export interface StatusChange {
  orderId: UUID;
  newStatus: OrderStatus;
}

@Component({
  selector: 'app-kitchen-order-list',
  imports: [OrderCardComponent, ListStateComponent],
  templateUrl: './kitchen-order-list.component.html',
})
export class KitchenOrderListComponent {
  orders    = input.required<ContentOrder[]>();
  isLoading = input<boolean>(false);
  error     = input<Error | undefined>();

  statusChange        = output<StatusChange>();
  servedProductOrder  = output<ServedProductOrder>();
  refresh             = output<void>();

  errorMessage = computed(() => this.error()?.message ?? null);

  filteredOrders = computed(() => {
    const active = this.orders().filter(o =>
      o.orderStatus === OrderStatus.PENDING  ||
      o.orderStatus === OrderStatus.PREPARING ||
      o.orderStatus === OrderStatus.READY
    );

    const byDate = (a: ContentOrder, b: ContentOrder) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

    const ready    = active.filter(o => o.orderStatus === OrderStatus.READY).sort(byDate);
    const nonReady = active.filter(o => o.orderStatus !== OrderStatus.READY).sort(byDate);

    return [...nonReady, ...ready];
  });

  onStatusChange(orderId: UUID, newStatus: OrderStatus) {
    this.statusChange.emit({ orderId, newStatus });
  }

  onRefresh() { this.refresh.emit(); }

  onServedProductOrder(served: ServedProductOrder) {
    this.servedProductOrder.emit(served);
  }
}
