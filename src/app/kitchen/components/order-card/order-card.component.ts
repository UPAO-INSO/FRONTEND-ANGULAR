import { Component, computed, input, output } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';

import { ContentOrder, OrderStatus } from '@orders/interfaces/order.interface';

@Component({
  selector: 'app-order-card',
  imports: [DatePipe, TitleCasePipe],
  templateUrl: './order-card.component.html',
})
export class OrderCardComponent {
  order = input.required<ContentOrder>();
  changeStatus = output<OrderStatus>();

  orderStatus = OrderStatus;

  allStatuses = [
    {
      value: OrderStatus.PENDING,
      label: 'Pendiente',
      color: 'bg-status-pending',
    },
    {
      value: OrderStatus.PREPARING,
      label: 'Preparando',
      color: 'bg-status-preparing',
    },
    {
      value: OrderStatus.READY,
      label: 'Listo',
      color: 'bg-status-ready',
    },
  ];

  statusColor = computed(() => {
    const status = this.order().orderStatus;
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-status-pending';
      case OrderStatus.PREPARING:
        return 'bg-status-preparing';
      case OrderStatus.READY:
        return 'bg-status-ready';
      default:
        return 'bg-gray-400';
    }
  });

  statusLabel = computed(() => {
    const currentStatus = this.order().orderStatus;

    const STATUS: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.PENDING]: 'Pendiente',
      [OrderStatus.PREPARING]: 'Preparando',
      [OrderStatus.READY]: 'Listo',
    };

    return STATUS[currentStatus] ?? '';
  });

  onStatusChange(newStatus: OrderStatus) {
    this.changeStatus.emit(newStatus);
  }
}
