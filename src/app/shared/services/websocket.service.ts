import { Injectable, NgZone, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { CompatClient, Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '@environments/environment';
import { RESTChangeStatusCulqiOrder } from '../interfaces/culqi.interface';

// ── Event types ───────────────────────────────────────────────────

export type WsConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WsOrderEvent {
  type: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'ORDER_STATUS_CHANGED' | 'PRODUCT_SERVED';
  orderId: string;
  tableId: number;
  orderStatus: string;
  timestamp: string;
}

export interface WsTableEvent {
  type: 'TABLE_STATUS_CHANGED';
  tableId: number;
  tableStatus: string;   // AVAILABLE | OCCUPIED | RESERVED
  timestamp: string;
}

export interface WsProductEvent {
  type: 'PRODUCT_AVAILABILITY';
  productId: number;
  productName: string;
  available: boolean;
  timestamp: string;
  updatedBy?: string;
}

// ── Service ───────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private client!: CompatClient;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT = 5;
  private readonly RECONNECT_BASE_MS = 3000;
  private reconnectTimer?: ReturnType<typeof setTimeout>;

  readonly connectionStatus = signal<WsConnectionStatus>('disconnected');

  // ── Streams públicos ────────────────────────────────────────────
  readonly orderEvents$   = new Subject<WsOrderEvent>();
  readonly tableEvents$   = new Subject<WsTableEvent>();
  readonly productEvents$ = new Subject<WsProductEvent>();
  readonly culqiEvents$   = new Subject<RESTChangeStatusCulqiOrder>();

  constructor() {
    this.connect();
  }

  // ── Conexión ────────────────────────────────────────────────────

  connect(): void {
    if (this.client?.connected) return;

    this.connectionStatus.set('connecting');

    const socket = new SockJS(`${environment.WS_URL}/api/ws`);
    this.client = Stomp.over(socket);
    this.client.debug = () => {};  // deshabilitar logs verbosos

    this.client.connect(
      {},
      () => this._onConnected(),
      (err: any) => this._onError(err),
    );
  }

  disconnect(): void {
    clearTimeout(this.reconnectTimer);
    if (this.client?.connected) {
      this.client.disconnect(() => this.connectionStatus.set('disconnected'));
    }
  }

  isConnected(): boolean {
    return !!this.client?.connected;
  }

  // ── Publicar desde frontend → backend ──────────────────────────

  /** Envía un cambio de disponibilidad de producto al backend. */
  sendProductAvailability(productId: number, available: boolean, updatedBy: string): boolean {
    if (!this.isConnected()) return false;
    const event: WsProductEvent = {
      type: 'PRODUCT_AVAILABILITY',
      productId,
      productName: '',
      available,
      updatedBy,
      timestamp: new Date().toISOString(),
    };
    this.client.send('/app/product-update', {}, JSON.stringify(event));
    return true;
  }

  // ── Privados ─────────────────────────────────────────────────────

  private _onConnected(): void {
    this.connectionStatus.set('connected');
    this.reconnectAttempts = 0;

    this.client.subscribe('/topic/orders',   msg => this._emit(msg.body, this.orderEvents$));
    this.client.subscribe('/topic/tables',   msg => this._emit(msg.body, this.tableEvents$));
    this.client.subscribe('/topic/products', msg => this._emit(msg.body, this.productEvents$));
    this.client.subscribe('/topic/culqi-order', msg => this._emit(msg.body, this.culqiEvents$));
  }

  private _onError(err: any): void {
    this.connectionStatus.set('error');
    this._scheduleReconnect();
  }

  private _scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT) {
      this.connectionStatus.set('error');
      return;
    }
    this.reconnectAttempts++;
    const delay = this.RECONNECT_BASE_MS * this.reconnectAttempts;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  private _emit<T>(body: string, subject: Subject<T>): void {
    try {
      subject.next(JSON.parse(body) as T);
    } catch {
      // ignorar mensajes malformados
    }
  }
}
