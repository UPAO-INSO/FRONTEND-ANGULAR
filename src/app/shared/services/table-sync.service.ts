import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface TableUpdate {
  tableId: number;
  type: 'status' | 'product' | 'full';
}

@Injectable({
  providedIn: 'root',
})
export class TableSyncService {
  private orderUpdated$ = new Subject<TableUpdate>();

  orderUpdates$ = this.orderUpdated$.asObservable();

  notifyOrderUpdate(update: TableUpdate) {
    this.orderUpdated$.next(update);
  }

  notifyStatusChange(tableId: number) {
    this.notifyOrderUpdate({ tableId, type: 'status' });
  }

  notifyProductChange(tableId: number) {
    this.notifyOrderUpdate({ tableId, type: 'product' });
  }

  notifyFullUpdate(tableId: number) {
    this.notifyOrderUpdate({ tableId, type: 'full' });
  }
}
