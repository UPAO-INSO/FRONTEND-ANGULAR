import { Component, inject } from '@angular/core';
import { WebSocketService } from '@shared/services/websocket.service';

@Component({
  selector: 'app-websocket-status',
  imports: [],
  templateUrl: './websocket-status.component.html',
})
export class WebsocketStatusComponent {
  private wsService = inject(WebSocketService);
}
