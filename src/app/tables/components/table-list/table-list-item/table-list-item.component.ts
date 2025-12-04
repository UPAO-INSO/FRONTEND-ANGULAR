import { TitleCasePipe } from '@angular/common';
import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  ContentOrder,
  OrderStatus,
} from '@src/app/orders/interfaces/order.interface';
import { OrderCartService } from '@src/app/orders/services/order-cart.service';
import { Table, TableStatus } from '@src/app/tables/interfaces/table.interface';

@Component({
  selector: 'app-table-list-item',
  imports: [TitleCasePipe],
  templateUrl: './table-list-item.component.html',
})
export class TableListItemComponent {
  private orderCartService = inject(OrderCartService);

  table = input.required<Table>();
  tableStatus = TableStatus;

  activeOrder = input<ContentOrder | null>(null);

  tableSelected = output<Table>();
  orderInTable = signal<ContentOrder | null>(null);

  hasCartOrders = computed(() => {
    const tablesWithOrders = this.orderCartService.getTablesWithOrders();
    return tablesWithOrders.includes(this.table().id);
  });

  onTableClick() {
    this.tableSelected.emit(this.table());
  }

  getOrderStatus(status: string): { class: string; text: string } {
    switch (status) {
      case 'PENDING':
        return { class: 'badge bg-amber-500', text: status };
      case 'PREPARING':
        return {
          class: 'badge bg-blue-600',
          text: status,
        };
      case 'PAID':
        return { class: 'badge bg-purple-700', text: status };
      case 'READY':
        return { class: 'badge bg-status-ready', text: status };
      case 'CANCELLED':
        return {
          class: 'badge bg-status-cancelled',
          text: status,
        };
      default:
        return { class: 'badge bg-gray-500', text: status };
    }
  }

  getStatus(status: TableStatus) {
    switch (status) {
      case TableStatus.AVAILABLE:
        return 'DISPONIBLE';
      case TableStatus.OCCUPIED:
        return 'OCUPADA';
      default:
        return '';
    }
  }

  getOrderInTableStatus(order: ContentOrder) {
    switch (order.orderStatus) {
      case OrderStatus.PREPARING:
        return 'bg-status-preparing';
      case OrderStatus.PENDING:
        return 'bg-status-pending';
      case OrderStatus.READY:
        return 'bg-status-ready';
      default:
        return 'bg-none';
    }
  }

  getOrderStatusText(order: ContentOrder | null): string {
    if (!order) return '';

    switch (order.orderStatus) {
      case OrderStatus.PREPARING:
        return 'PREPARANDO';
      case OrderStatus.PENDING:
        return 'PENDIENTE';
      case OrderStatus.READY:
        return 'LISTO';
      default:
        return '';
    }
  }
}
