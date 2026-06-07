import { inject, Injectable, signal } from '@angular/core';
import { WebSocketService } from './websocket.service';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  type:      NotificationType;
  icon:      string;
  title:     string;
  message:   string;
  timestamp: Date;
  /** ms hasta que se cierre automáticamente. 0 = no se cierra solo. */
  duration:  number;
}

const DURATION = {
  short:  4_000,
  normal: 6_000,
  long:   8_000,
};

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private ws = inject(WebSocketService);

  readonly notifications = signal<AppNotification[]>([]);

  constructor() {
    this._listenOrders();
    this._listenTables();
    this._listenProducts();
  }

  // ── API pública ──────────────────────────────────────────────────

  add(notif: Omit<AppNotification, 'id' | 'timestamp'>): void {
    const entry: AppNotification = {
      ...notif,
      id:        crypto.randomUUID(),
      timestamp: new Date(),
    };

    this.notifications.update(list => [entry, ...list].slice(0, 6)); // max 6 visibles

    if (entry.duration > 0) {
      setTimeout(() => this.dismiss(entry.id), entry.duration);
    }
  }

  dismiss(id: string): void {
    this.notifications.update(list => list.filter(n => n.id !== id));
  }

  clearAll(): void {
    this.notifications.set([]);
  }

  // ── Escuchas de WebSocket (solo eventos remotos) ─────────────────

  private _listenOrders(): void {
    this.ws.orderEvents$.subscribe(ev => {
      switch (ev.type) {

        case 'ORDER_CREATED':
          this.add({
            type:     'info',
            icon:     'fa-solid fa-receipt',
            title:    'Nueva orden',
            message:  `Mesa ${ev.tableId}`,
            duration: DURATION.normal,
          });
          break;

        case 'ORDER_STATUS_CHANGED':
          this._orderStatusNotif(ev.tableId, ev.orderStatus);
          break;

        case 'PRODUCT_SERVED':
          this.add({
            type:     'info',
            icon:     'fa-solid fa-bowl-food',
            title:    'Producto servido',
            message:  `Mesa ${ev.tableId}`,
            duration: DURATION.short,
          });
          break;
      }
    });
  }

  private _orderStatusNotif(tableId: number, status: string): void {
    const table = `Mesa ${tableId}`;

    switch (status?.toUpperCase()) {
      case 'PREPARING':
        this.add({ type: 'info',    icon: 'fa-solid fa-fire',         title: 'En preparación',   message: table, duration: DURATION.short  }); break;
      case 'READY':
        this.add({ type: 'success', icon: 'fa-solid fa-circle-check', title: '¡Pedido listo!',   message: `${table} — listo para servir`, duration: DURATION.long  }); break;
      case 'PAID':
        this.add({ type: 'success', icon: 'fa-solid fa-credit-card',  title: 'Pago recibido',    message: table, duration: DURATION.normal }); break;
      case 'COMPLETED':
        this.add({ type: 'success', icon: 'fa-solid fa-check-double', title: 'Orden completada', message: table, duration: DURATION.short  }); break;
      case 'CANCELLED':
        this.add({ type: 'error',   icon: 'fa-solid fa-ban',          title: 'Orden cancelada',  message: table, duration: DURATION.normal }); break;
    }
  }

  private _listenTables(): void {
    this.ws.tableEvents$.subscribe(ev => {
      const table = `Mesa ${ev.tableId}`;

      switch (ev.tableStatus?.toUpperCase()) {
        case 'OCCUPIED':
          this.add({ type: 'warning', icon: 'fa-solid fa-chair',  title: 'Mesa ocupada',    message: table, duration: DURATION.short  }); break;
        case 'AVAILABLE':
          this.add({ type: 'success', icon: 'fa-solid fa-table',  title: 'Mesa disponible', message: table, duration: DURATION.short  }); break;
        case 'RESERVED':
          this.add({ type: 'info',    icon: 'fa-solid fa-clock',  title: 'Mesa reservada',  message: table, duration: DURATION.short  }); break;
      }
    });
  }

  private _listenProducts(): void {
    this.ws.productEvents$.subscribe(ev => {
      if (ev.available) {
        this.add({ type: 'success', icon: 'fa-solid fa-circle-check', title: 'Disponible',      message: ev.productName, duration: DURATION.short  });
      } else {
        this.add({ type: 'warning', icon: 'fa-solid fa-circle-xmark', title: 'Sin disponibilidad', message: ev.productName, duration: DURATION.normal });
      }
    });
  }
}
