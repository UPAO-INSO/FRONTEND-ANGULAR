import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { OrderCartService } from 'src/app/orders/services/order-cart.service';
import { Table, TableStatus } from 'src/app/tables/interfaces/table.interface';

@Component({
  selector: 'app-table-list-item',
  imports: [TitleCasePipe],
  templateUrl: './table-list-item.component.html',
})
export class TableListItemComponent {
  private orderCartService = inject(OrderCartService);

  table = input.required<Table>();
  tableStatus = input.required<typeof TableStatus>();

  tableSelected = output<Table>();

  hasOrders = computed(() => {
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
}
