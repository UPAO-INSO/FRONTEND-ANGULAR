import { Injectable } from '@angular/core';
import { UUID } from '@src/app/orders/interfaces/order.interface';
import { Subject } from 'rxjs';

export interface OrderUpdate {
  orderId: UUID;
  type: 'created' | 'status' | 'product' | 'full' | 'deleted';
  tableId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class OrderSyncService {
  private orderUpdated$ = new Subject<OrderUpdate>();

  orderUpdates$ = this.orderUpdated$.asObservable();

  notifyOrderUpdate(update: OrderUpdate) {
    console.log('OrderSync: Notificando actualización', update);
    this.orderUpdated$.next(update);
  }

  notifyOrderCreated(orderId: UUID, tableId?: number) {
    this.notifyOrderUpdate({ orderId, type: 'created', tableId });
  }

  notifyStatusChange(orderId: UUID, tableId?: number) {
    this.notifyOrderUpdate({ orderId, type: 'status', tableId });
  }

  notifyProductChange(orderId: UUID, tableId?: number) {
    this.notifyOrderUpdate({ orderId, type: 'product', tableId });
  }

  notifyFullUpdate(orderId: UUID, tableId?: number) {
    this.notifyOrderUpdate({ orderId, type: 'full', tableId });
  }

  notifyOrderDeleted(orderId: UUID, tableId?: number) {
    this.notifyOrderUpdate({ orderId, type: 'deleted', tableId });
  }
}
