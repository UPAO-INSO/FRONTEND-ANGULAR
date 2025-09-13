import { TitleCasePipe } from '@angular/common';
import { Component, input, signal } from '@angular/core';
import { OrderStatus } from 'src/app/orders/interfaces/order.interface';
import { Table, TableStatus } from 'src/app/tables/interfaces/table.interface';

@Component({
  selector: 'app-table-list-item',
  imports: [TitleCasePipe],
  templateUrl: './table-list-item.component.html',
})
export class TableListItemComponent {
  table = input.required<Table>();
  orderStatus = input<OrderStatus>();

  tableStatus = signal(TableStatus);

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
}
