import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import {
  ContentOrder,
  OrderStatus,
} from '@src/app/orders/interfaces/order.interface';
import { OrderCartService } from '@src/app/orders/services/order-cart.service';
import { Table, TableStatus } from '@src/app/tables/interfaces/table.interface';
import {
  ORDER_STATUS_BG_CLASS,
  ORDER_STATUS_LABELS,
} from '@src/app/shared/utils/order-status.utils';

@Component({
  selector: 'app-table-list-item',
  imports: [TitleCasePipe],
  templateUrl: './table-list-item.component.html',
})
export class TableListItemComponent {
  private orderCartService = inject(OrderCartService);

  table       = input.required<Table>();
  activeOrder = input<ContentOrder | null>(null);
  tableStatus = TableStatus;

  tableSelected = output<Table>();
  orderInTable  = signal<ContentOrder | null>(null);

  hasCartOrders = computed(() =>
    this.orderCartService.getTablesWithOrders().includes(this.table().id)
  );

  onTableClick() {
    this.tableSelected.emit(this.table());
  }

  getTableStatusText(status: TableStatus): string {
    const MAP: Partial<Record<TableStatus, string>> = {
      [TableStatus.AVAILABLE]: 'DISPONIBLE',
      [TableStatus.OCCUPIED]:  'OCUPADA',
      [TableStatus.RESERVED]:  'RESERVADA',
    };
    return MAP[status] ?? '';
  }

  getOrderStatusBg(order: ContentOrder): string {
    return ORDER_STATUS_BG_CLASS[order.orderStatus] ?? 'bg-none';
  }

  getOrderStatusText(order: ContentOrder | null): string {
    if (!order) return '';
    return ORDER_STATUS_LABELS[order.orderStatus] ?? '';
  }
}
