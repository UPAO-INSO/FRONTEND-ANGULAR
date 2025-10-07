import { Component, inject } from '@angular/core';
import { WebSocketService } from '@shared/services/websocket.service';

@Component({
  selector: 'app-websocket-status',
  imports: [],
  templateUrl: './websocket-status.component.html',
})
export class WebsocketStatusComponent {
  private wsService = inject(WebSocketService);

  // connectionStatus = this.wsService.connectionStatus;

  // getStatusClass(): string {
  //   switch (this.connectionStatus()) {
  //     case 'connected':
  //       return 'bg-green-500';
  //     case 'connecting':
  //       return 'bg-yellow-500 animate-pulse';
  //     case 'disconnected':
  //       return 'bg-gray-500';
  //     case 'error':
  //       return 'bg-red-500';
  //     default:
  //       return 'bg-gray-500';
  //   }
  // }

  // getTextClass(): string {
  //   switch (this.connectionStatus()) {
  //     case 'connected':
  //       return 'text-green-400';
  //     case 'connecting':
  //       return 'text-yellow-400';
  //     case 'disconnected':
  //       return 'text-gray-400';
  //     case 'error':
  //       return 'text-red-400';
  //     default:
  //       return 'text-gray-400';
  //   }
  // }

  // getStatusText(): string {
  //   switch (this.connectionStatus()) {
  //     case 'connected':
  //       return 'Conectado';
  //     case 'connecting':
  //       return 'Conectando...';
  //     case 'disconnected':
  //       return 'Desconectado';
  //     case 'error':
  //       return 'Error';
  //     default:
  //       return 'Desconocido';
  //   }
  // }
}
