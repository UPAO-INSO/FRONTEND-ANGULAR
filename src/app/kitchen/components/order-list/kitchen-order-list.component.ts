import { Component, input, output } from '@angular/core';

import { OrderCardComponent } from '../order-card/order-card.component';

import {
  ContentKitchen,
  KitchenOrderStatus,
} from '../../interfaces/kitchen-order.interface';

@Component({
  selector: 'app-kitchen-order-list',
  imports: [OrderCardComponent],
  templateUrl: './kitchen-order-list.component.html',
})
export class KitchenOrderListComponent {
  orders = input.required<ContentKitchen[]>();
  isLoading = input<boolean>(false);
  error = input<Error | undefined>();

  statusChange = output<{ orderId: number; newStatus: KitchenOrderStatus }>();
  refresh = output<void>();

  onStatusChange(orderId: number, newStatus: KitchenOrderStatus) {
    this.statusChange.emit({ orderId, newStatus });
  }

  onRefresh() {
    this.refresh.emit();
  }
}
