import { inject, Injectable, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { WebSocketService } from './websocket.service';

export interface TableUpdate {
  tableId: number;
  type: 'status' | 'full';
  tableStatus?: string;   // AVAILABLE | OCCUPIED | RESERVED
  remote?: boolean;
}

@Injectable({ providedIn: 'root' })
export class TableSyncService implements OnDestroy {
  private ws = inject(WebSocketService);
  private sub!: Subscription;

  private readonly _updates$ = new Subject<TableUpdate>();
  /** Stream unificado: eventos locales + eventos WebSocket remotos */
  readonly tableUpdates$ = this._updates$.asObservable();

  constructor() {
    // Suscribirse a cambios de mesa que vienen del servidor
    this.sub = this.ws.tableEvents$.subscribe(event => {
      this._updates$.next({
        tableId:     event.tableId,
        type:        'status',
        tableStatus: event.tableStatus,
        remote:      true,
      });
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  notifyStatusChange(tableId: number, tableStatus?: string): void {
    this._updates$.next({ tableId, type: 'status', tableStatus, remote: false });
  }

  notifyFullUpdate(tableId: number): void {
    this._updates$.next({ tableId, type: 'full', remote: false });
  }
}
