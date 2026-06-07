import { inject, Injectable, NgZone, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
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
  tableStatus: string;
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
  private ngZone = inject(NgZone);

  private client!: Client;
  private subscriptions: StompSubscription[] = [];
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT = 8;
  private readonly RECONNECT_BASE_MS = 3000;

  readonly connectionStatus = signal<WsConnectionStatus>('disconnected');

  // ── Streams públicos (Subject emite dentro de NgZone) ──────────
  readonly orderEvents$   = new Subject<WsOrderEvent>();
  readonly tableEvents$   = new Subject<WsTableEvent>();
  readonly productEvents$ = new Subject<WsProductEvent>();
  readonly culqiEvents$   = new Subject<RESTChangeStatusCulqiOrder>();

  constructor() {
    this.connect();
  }

  // ── Conexión ────────────────────────────────────────────────────

  connect(): void {
    if (this.client?.active) return;

    this.connectionStatus.set('connecting');

    /**
     * Usar @stomp/stompjs Client moderno (no el CompatClient deprecado).
     * webSocketFactory retorna un SockJS que maneja fallbacks automáticamente.
     * Todas las callbacks se envuelven en NgZone.run() para que Angular
     * detecte los cambios en modo Zoneless.
     */
    this.client = new Client({
      webSocketFactory: () => new SockJS(`${environment.WS_URL}/api/ws`),

      onConnect: () => {
        this.ngZone.run(() => {
          this.connectionStatus.set('connected');
          this.reconnectAttempts = 0;
          this._subscribe();
        });
      },

      onStompError: (frame) => {
        this.ngZone.run(() => {
          console.error('STOMP error:', frame.headers['message']);
          this.connectionStatus.set('error');
        });
      },

      onDisconnect: () => {
        this.ngZone.run(() => {
          this.connectionStatus.set('disconnected');
        });
      },

      onWebSocketError: (evt) => {
        this.ngZone.run(() => {
          console.warn('WebSocket error:', evt);
          this.connectionStatus.set('error');
        });
      },

      // Reconexión automática con backoff
      reconnectDelay: 5000,

      // Silenciar logs en producción
      debug: environment.production ? () => {} : (msg) => console.debug('[WS]', msg),
    });

    // Activar fuera de la zona para no impactar change detection con heartbeats
    this.ngZone.runOutsideAngular(() => this.client.activate());
  }

  disconnect(): void {
    this.client?.deactivate();
    this.subscriptions = [];
    this.connectionStatus.set('disconnected');
  }

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  // ── Publicar desde frontend → backend ──────────────────────────

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
    this.client.publish({ destination: '/app/product-update', body: JSON.stringify(event) });
    return true;
  }

  // ── Privados ─────────────────────────────────────────────────────

  private _subscribe(): void {
    // Limpiar suscripciones previas
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];

    const sub = (dest: string, handler: (msg: IMessage) => void) => {
      // Callbacks de mensajes deben correr DENTRO de NgZone para Zoneless
      const s = this.client.subscribe(dest, (msg) => {
        this.ngZone.run(() => handler(msg));
      });
      this.subscriptions.push(s);
    };

    sub('/topic/orders',      msg => this._emit(msg.body, this.orderEvents$));
    sub('/topic/tables',      msg => this._emit(msg.body, this.tableEvents$));
    sub('/topic/products',    msg => this._emit(msg.body, this.productEvents$));
    sub('/topic/culqi-order', msg => this._emit(msg.body, this.culqiEvents$));
  }

  private _emit<T>(body: string, subject: Subject<T>): void {
    try {
      subject.next(JSON.parse(body) as T);
    } catch {
      // ignorar mensajes malformados
    }
  }
}
