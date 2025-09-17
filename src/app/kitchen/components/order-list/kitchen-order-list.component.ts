import { Component, input, output } from '@angular/core';

import { OrderCardComponent } from '../order-card/order-card.component';
import type {
  Order,
  OrderStatus,
  RestOrderStatus,
} from 'src/app/orders/interfaces/order.interface';

@Component({
  selector: 'app-order-list',
  imports: [OrderCardComponent],
  templateUrl: './kitchen-order-list.component.html',
})
export class OrderListComponent {
  orders = input<Order[]>([]);
  changeStatus = output<RestOrderStatus.PREPARING | RestOrderStatus.READY>();
}
