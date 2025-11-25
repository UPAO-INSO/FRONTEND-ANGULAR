import {
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';

import {
  ContentOrder,
  OrderStatus,
  ProductOrder,
} from '@orders/interfaces/order.interface';
import { ConfirmReadyModalComponent } from './confirm-ready-modal/confirm-ready-modal.component';
import { OrderSyncService } from '@src/app/shared/services/order-sync.service';

interface ProductProgress {
  productOrder: ProductOrder;
  total: number;
  completed: number;
  isChecked?: boolean;
}

export interface ServedProductOrder {
  orderId: number;
  productOrderId: number;
  quantity: number;
}

@Component({
  selector: 'app-order-card',
  imports: [DatePipe, TitleCasePipe, ConfirmReadyModalComponent],
  templateUrl: './order-card.component.html',
})
export class OrderCardComponent {
  private orderSyncService = inject(OrderSyncService);

  order = input.required<ContentOrder>();
  changeStatus = output<OrderStatus>();

  orderStatus = OrderStatus;

  productProgress = signal<Map<number, ProductProgress>>(new Map());
  showConfirmModal = signal<boolean>(false);

  servedProductOrder = output<ServedProductOrder>();

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

  constructor() {
    effect(() => {
      const currentOrder = this.order();
      if (currentOrder) {
        this.initializeProgress();
      }
    });
  }

  initializeProgress() {
    const progressMap = new Map<number, ProductProgress>();

    this.order().productOrders.forEach((product) => {
      const isCompleted = product.servedQuantity === product.quantity;

      progressMap.set(product.id, {
        productOrder: product,
        completed: product.servedQuantity,
        total: product.quantity,
        isChecked: isCompleted,
      });
    });

    this.productProgress.set(progressMap);
  }

  toggleProductCheck(productId: number) {
    const progressMap = new Map(this.productProgress());
    const current = progressMap.get(productId);

    if (current && current.total === 1) {
      const newCompleted = current.completed === 0 ? 1 : 0;
      const quantity = newCompleted === 1 ? 1 : -1;

      this.onServedProductOrder({
        orderId: this.order().id,
        productOrderId: productId,
        quantity: quantity,
      });

      current.completed = newCompleted;
      current.isChecked = newCompleted === 1;

      progressMap.set(productId, current);
      this.productProgress.set(progressMap);
    }
  }

  incrementProgress(productId: number) {
    const progressMap = new Map(this.productProgress());
    const current = progressMap.get(productId);

    if (current && current.completed < current.total) {
      current.completed++;
      progressMap.set(productId, current);
      this.productProgress.set(progressMap);
    }
  }

  decrementProgress(productId: number) {
    const progressMap = new Map(this.productProgress());
    const current = progressMap.get(productId);

    if (current && current.productOrder.servedQuantity > 0) {
      current.completed--;
      progressMap.set(productId, current);
      this.productProgress.set(progressMap);
    }
  }

  getProductProgress(productId: number): ProductProgress {
    return this.productProgress().get(productId)!;
  }

  getProgressPercentage(productId: number): number {
    const progress = this.getProductProgress(productId);
    if (!progress || progress.total === 0) return 0;
    return (progress.completed / progress.total) * 100;
  }

  isProductCompleted(productId: number): boolean {
    const progress = this.getProductProgress(productId);
    return progress ? progress.completed === progress.total : false;
  }

  areAllProductsCompleted(): boolean {
    const allProgress = Array.from(this.productProgress().values());
    return allProgress.every((p) => p.completed === p.total);
  }

  statusColor() {
    const status = this.order().orderStatus;
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-status-pending text-status-text-pending';
      case OrderStatus.PREPARING:
        return 'bg-status-preparing text-status-text-preparing';
      case OrderStatus.READY:
        return 'bg-status-ready text-status-text-ready';
      default:
        return '';
    }
  }

  statusLabel() {
    const status = this.order().orderStatus;
    switch (status) {
      case OrderStatus.PENDING:
        return 'Pendiente';
      case OrderStatus.PREPARING:
        return 'Preparando';
      case OrderStatus.READY:
        return 'Listo';
      default:
        return '';
    }
  }

  onStatusChange(status: OrderStatus) {
    if (status === OrderStatus.READY) {
      this.showConfirmModal.set(true);
    } else {
      this.changeStatus.emit(status);
      this.orderSyncService.notifyStatusChange(this.order().id);
    }
  }

  confirmReady() {
    this.changeStatus.emit(OrderStatus.READY);
    this.showConfirmModal.set(false);
    this.orderSyncService.notifyStatusChange(this.order().id);
  }

  cancelReady() {
    this.showConfirmModal.set(false);
  }

  onServedProductOrder(served: ServedProductOrder) {
    this.servedProductOrder.emit(served);
    this.orderSyncService.notifyProductChange(this.order().id);
  }
}
