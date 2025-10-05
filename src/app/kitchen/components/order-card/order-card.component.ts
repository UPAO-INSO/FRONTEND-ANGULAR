import { Component, computed, input, output, signal } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import {
  ContentKitchen,
  KitchenOrderStatus,
} from '../../interfaces/kitchen-order.interface';
import { ContentOrder } from '@orders/interfaces/order.interface';

@Component({
  selector: 'app-order-card',
  imports: [DatePipe, TitleCasePipe],
  templateUrl: './order-card.component.html',
})
export class OrderCardComponent {
  order = input.required<ContentOrder>();
  changeStatus = output<KitchenOrderStatus>();

  orderStatus = KitchenOrderStatus;

  allStatuses = [
    {
      value: KitchenOrderStatus.PENDING,
      label: 'Pendiente',
      color: 'bg-status-pending',
    },
    {
      value: KitchenOrderStatus.PREPARING,
      label: 'Preparando',
      color: 'bg-status-preparing',
    },
    {
      value: KitchenOrderStatus.READY,
      label: 'Listo',
      color: 'bg-status-ready',
    },
  ];

  statusColor = computed(() => {
    const status = this.order().orderStatus;
    switch (status) {
      case KitchenOrderStatus.PENDING:
        return 'bg-status-pending';
      case KitchenOrderStatus.PREPARING:
        return 'bg-status-preparing';
      case KitchenOrderStatus.READY:
        return 'bg-status-ready';
      default:
        return 'bg-gray-400';
    }
  });

  statusLabel = computed(() => {
    const status = this.order().orderStatus;
    switch (status) {
      case KitchenOrderStatus.PENDING:
        return 'Pendiente';
      case KitchenOrderStatus.PREPARING:
        return 'Preparando';
      case KitchenOrderStatus.READY:
        return 'Listo';
      default:
        return 'Desconocido';
    }
  });

  onStatusChange(newStatus: KitchenOrderStatus) {
    this.changeStatus.emit(newStatus);
  }
}
