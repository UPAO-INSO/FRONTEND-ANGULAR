import { Injectable, signal } from '@angular/core';
import { CompatClient, Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject, BehaviorSubject } from 'rxjs';
import { environment } from '@environments/environment';
import { WebSocketMessage } from '@shared/interfaces/websocket-message.interface';

export interface ProductUpdateMessage {
  type: 'PRODUCT_UPDATE';
  productId: number;
  available: boolean;
  timestamp: string;
  updatedBy: string;
}

// export interface OrderUpdateMessage {
//   type: 'ORDER_UPDATE';
//   orderId: number;
//   status: string;
//   timestamp: string;
// }

// export type WebSocketMessage = ProductUpdateMessage | OrderUpdateMessage;

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private stompClient!: CompatClient;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private envs = environment;

  connectionStatus = signal<
    'connected' | 'disconnected' | 'connecting' | 'error'
  >('disconnected');

  private productUpdateSubject =
    new BehaviorSubject<ProductUpdateMessage | null>(null);
  productUpdates$ = this.productUpdateSubject.asObservable();

  private messageSubject = new Subject<any>();
  messages$ = this.messageSubject.asObservable();

  constructor() {
    this.initConnectionSocket();
  }

  initConnectionSocket() {
    const url = `${this.envs.WS_URL}/api/ws`;
    const socket = new SockJS(url);
    this.stompClient = Stomp.over(socket);

    this.stompClient.debug = (str) => {
      console.log('STOMP:', str);
    };

    this.stompClient.connect(
      {},
      (frame: any) => this.onConnected(frame),
      (error: any) => this.onError(error)
    );
  }

  private onConnected(frame: any) {
    console.log('WebSocket connected successfully:', frame);
    this.connectionStatus.set('connected');
    this.reconnectAttempts = 0;

    this.subscribeToProductUpdates();
  }

  private onError(error: any) {
    console.error('WebSocket connection error:', error);
    this.connectionStatus.set('error');
    this.attemptReconnect();
  }

  private subscribeToProductUpdates() {
    this.stompClient.subscribe('/topic/product-updates', (message) => {
      try {
        const productUpdate: ProductUpdateMessage = JSON.parse(message.body);
        console.log('Product update received via WebSocket:', productUpdate);
        this.productUpdateSubject.next(productUpdate);
      } catch (error) {
        console.error('Error parsing product update:', error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
      );

      setTimeout(() => {
        this.initConnectionSocket();
      }, 3000 * this.reconnectAttempts);
    } else {
      console.log('Max reconnection attempts reached');
      this.connectionStatus.set('error');
    }
  }

  isConnected(): boolean {
    return this.stompClient && this.stompClient.connected;
  }

  sendProductUpdate(productId: number, available: boolean, userId: string) {
    if (this.isConnected()) {
      const message: ProductUpdateMessage = {
        type: 'PRODUCT_UPDATE',
        productId,
        available,
        timestamp: new Date().toISOString(),
        updatedBy: userId,
      };

      // ✅ Enviar a /app/product-update que será procesado por el backend
      this.stompClient.send('/app/product-update', {}, JSON.stringify(message));
      console.log('📤 Product update sent via WebSocket:', message);

      return true;
    } else {
      console.warn('⚠️ Cannot send product update - WebSocket not connected');
      console.warn('Current status:', this.connectionStatus());

      // ✅ Intentar reconectar
      this.attemptReconnect();
      return false;
    }
  }

  joinRoom(roomId: string) {
    this.stompClient.connect({}, () => {
      this.stompClient.subscribe(`/topic/${roomId}`, (messages: any) => {
        const messageContent = JSON.parse(messages.body);
        console.log(messageContent);
      });
    });
  }

  sendMessage(roomId: string, message: WebSocketMessage) {
    if (this.isConnected()) {
      this.stompClient.send(
        `/app/sendMessage/${roomId}`,
        {},
        JSON.stringify(message)
      );

      return true;
    } else {
      console.warn('Cannot send message - WebSocket not connected');
      return false;
    }
  }

  disconnect() {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.disconnect(() => {
        console.log('🔌 WebSocket disconnected');
        this.connectionStatus.set('disconnected');
      });
    }
  }
}
