import { inject, Injectable, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { UUID } from '@src/app/orders/interfaces/order.interface';
import { WebSocketService } from './websocket.service';

export interface OrderUpdate {
  orderId: UUID;
  type: 'created' | 'updated' | 'status' | 'product' | 'full' | 'deleted';
  tableId?: number;
  orderStatus?: string;
  /** true = evento remoto (otro usuario), false = acción local */
  remote?: boolean;
}

@Injectable({ providedIn: 'root' })
export class OrderSyncService implements OnDestroy {
  private ws = inject(WebSocketService);
  private sub!: Subscription;

  private readonly _updates$ = new Subject<OrderUpdate>();
  /** Stream unificado: eventos locales + eventos WebSocket remotos */
  readonly orderUpdates$ = this._updates$.asObservable();

  constructor() {
    // Suscribirse a eventos de pedidos que vienen del servidor
    this.sub = this.ws.orderEvents$.subscribe(event => {
      this._updates$.next({
        orderId:     event.orderId,
        type:        this._mapType(event.type),
        tableId:     event.tableId,
        orderStatus: event.orderStatus,
        remote:      true,
      });
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // ── Notificaciones locales (acciones de este mismo usuario) ─────

  notifyOrderCreated(orderId: UUID, tableId?: number) {
    this._emit({ orderId, type: 'created', tableId });
  }

  notifyStatusChange(orderId: UUID, tableId?: number) {
    this._emit({ orderId, type: 'status', tableId });
  }

  notifyProductChange(orderId: UUID, tableId?: number) {
    this._emit({ orderId, type: 'product', tableId });
  }

  notifyOrderUpdated(orderId: UUID, tableId?: number) {
    this._emit({ orderId, type: 'updated', tableId });
  }

  notifyOrderDeleted(orderId: UUID, tableId?: number) {
    this._emit({ orderId, type: 'deleted', tableId });
  }

  // ── Helpers ──────────────────────────────────────────────────────

  private _emit(update: OrderUpdate): void {
    this._updates$.next({ ...update, remote: false });
  }

  private _mapType(wsType: string): OrderUpdate['type'] {
    switch (wsType) {
      case 'ORDER_CREATED':        return 'created';
      case 'ORDER_UPDATED':        return 'updated';
      case 'ORDER_STATUS_CHANGED': return 'status';
      case 'PRODUCT_SERVED':       return 'product';
      default:                     return 'full';
    }
  }
}
