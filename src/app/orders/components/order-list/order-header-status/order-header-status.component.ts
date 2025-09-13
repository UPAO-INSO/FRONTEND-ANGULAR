import { Component, output, signal } from '@angular/core';
import { RestOrderStatus } from 'src/app/orders/interfaces/order.interface';

@Component({
  selector: 'app-order-header-status',
  imports: [],
  templateUrl: './order-header-status.component.html',
})
export class OrderStatusComponent {
  status = output<string>();

  orderStatus = RestOrderStatus;
}
