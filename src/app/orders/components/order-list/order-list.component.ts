import { Component, input, output, signal } from '@angular/core';
import {
  ContentOrder,
  OrderStatus,
  UUID,
} from '../../interfaces/order.interface';
import { OrderListItemComponent } from './order-list-item/order-list-item.component';
import { OrderViewComponent } from '../order-view/order-view.component';
import { PaginationComponent } from '@src/app/shared/components/pagination/pagination.component';
import { ListStateComponent } from '@src/app/shared/components/list-state/list-state.component';

interface StatusChange {
  orderId: UUID;
  newStatus: OrderStatus;
}

@Component({
  selector: 'app-order-list',
  imports: [OrderListItemComponent, OrderViewComponent, PaginationComponent, ListStateComponent],
  templateUrl: './order-list.component.html',
})
export class OrderListComponent {
  orders       = input.required<ContentOrder[]>({});
  totalPages   = input.required<number>();
  currentPage  = input.required<number>();
  isEmpty      = input<boolean>(false);
  isLoading    = input<boolean>(false);
  errorMessage = input<string | null>(null);

  selectedOrder = signal<ContentOrder | null>(null);
  statusChange  = output<StatusChange>();
  orderStatus   = OrderStatus;

  onChangeStatus(orderId: UUID, newStatus: OrderStatus) {
    this.statusChange.emit({ orderId, newStatus });
  }

  openViewOrder(order: ContentOrder)  { this.selectedOrder.set(order); }
  closeViewOrder()                    { this.selectedOrder.set(null);  }
}
