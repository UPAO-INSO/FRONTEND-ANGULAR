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
      color: 'badge-warning',
    },
    {
      value: KitchenOrderStatus.PREPARING,
      label: 'Preparando',
      color: 'badge-info',
    },
    { value: KitchenOrderStatus.READY, label: 'Listo', color: 'badge-success' },
  ];

  statusColor = computed(() => {
    const status = this.order().orderStatus;
    switch (status) {
      case KitchenOrderStatus.PENDING:
        return 'badge-warning';
      case KitchenOrderStatus.PREPARING:
        return 'badge-info';
      case KitchenOrderStatus.READY:
        return 'badge-success';
      default:
        return 'badge-neutral';
    }
  });

  // Computed para el label del estado
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
