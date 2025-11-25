import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface OrderUpdate {
  orderId: number;
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

  notifyOrderCreated(orderId: number, tableId?: number) {
    this.notifyOrderUpdate({ orderId, type: 'created', tableId });
  }

  notifyStatusChange(orderId: number, tableId?: number) {
    this.notifyOrderUpdate({ orderId, type: 'status', tableId });
  }

  notifyProductChange(orderId: number, tableId?: number) {
    this.notifyOrderUpdate({ orderId, type: 'product', tableId });
  }

  notifyFullUpdate(orderId: number, tableId?: number) {
    this.notifyOrderUpdate({ orderId, type: 'full', tableId });
  }

  notifyOrderDeleted(orderId: number, tableId?: number) {
    this.notifyOrderUpdate({ orderId, type: 'deleted', tableId });
  }
}
