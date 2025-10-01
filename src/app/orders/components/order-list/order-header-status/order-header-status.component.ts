import { Component, output, signal } from '@angular/core';
import { OrderStatus } from 'src/app/orders/interfaces/order.interface';

@Component({
  selector: 'app-order-header-status',
  imports: [],
  templateUrl: './order-header-status.component.html',
})
export class OrderStatusComponent {
  status = output<OrderStatus | null>();

  orderStatus = OrderStatus;

  selectedStatus = signal<OrderStatus | null>(null);

  selectStatus(newStatus: OrderStatus | null) {
    this.selectedStatus.set(newStatus);
    this.status.emit(newStatus);
  }
}
