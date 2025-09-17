import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  Order,
  OrderStatus,
  RestOrderStatus,
} from 'src/app/orders/interfaces/order.interface';

@Component({
  selector: 'app-order-card',
  imports: [DatePipe],
  templateUrl: './order-card.component.html',
})
export class OrderCardComponent {
  order = input.required<Order>();
  changeStatus = output<RestOrderStatus.PREPARING | RestOrderStatus.READY>();

  orderStatus = RestOrderStatus;

  getStatusLabel() {
    switch (this.order().estado) {
      case 'PENDING':
        return 'Pendiente';
      case 'PREPARING':
        return 'Preparando';
      case 'READY':
        return 'Listo';
      default:
        return '';
    }
  }

  get statusColor() {
    switch (this.order().estado) {
      case 'PENDIENTE':
        return 'badge-warning';
      case 'EN_PREPARACION':
        return 'badge-info';
      case 'LISTO':
        return 'badge-success';
      default:
        return '';
    }
  }
}
