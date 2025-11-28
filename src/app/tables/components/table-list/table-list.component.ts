import { Component, input, output, signal } from '@angular/core';

import { RegisterOrderComponent } from '@src/app/orders/components/register-order/register-order.component';
import { ProductType } from '@src/app/products/interfaces/product.type';
import { OrderViewComponent } from '@src/app/orders/components/order-view/order-view.component';
import {
  ContentOrder,
  OrderStatus,
  RequestOrder,
  UUID,
} from '@src/app/orders/interfaces/order.interface';

import {
  ContentTable,
  Table,
  TableStatus,
} from '../../interfaces/table.interface';
import { TableListItemComponent } from './table-list-item/table-list-item.component';

interface StatusChange {
  orderId: UUID;
  newStatus: OrderStatus;
}

interface OrderUpdate {
  id: UUID;
  order: ContentOrder;
}

@Component({
  selector: 'app-table-list',
  imports: [TableListItemComponent, RegisterOrderComponent, OrderViewComponent],
  templateUrl: './table-list.component.html',
})
export class TableListComponent {
  tables = input.required<ContentTable[]>();
  modifyStatus = input.required<boolean>();

  activeOrdersByTable = input<Map<number, ContentOrder>>(new Map());
  isEmpty = input<boolean>(false);
  isLoading = input<boolean>(false);
  errorMessage = input<string | unknown | null>();

  orderStatus = OrderStatus;

  statusChange = output<StatusChange>();
  refresh = output<void>();
  orderCreated = output<RequestOrder>();
  orderUpdated = output<OrderUpdate>();
  modifyStatusChanged = output<boolean>();

  selectedTable = signal<Table | null>(null);
  selectedProductCategory = signal<ProductType | null>(null);

  onChangeModifyStatus(status: boolean) {
    this.modifyStatusChanged.emit(status);
  }

  onChangeStatus(orderId: UUID, newStatus: OrderStatus) {
    this.statusChange.emit({ orderId, newStatus });
  }

  onOrderCreated(orderData: RequestOrder) {
    this.orderCreated.emit(orderData);
  }

  onOrderUpdated(id: UUID, order: ContentOrder) {
    this.orderUpdated.emit({ id, order });
  }

  openRegisterOrder(table: Table) {
    this.selectedTable.set(table);
  }

  closeRegisterOrder() {
    this.selectedTable.set(null);
  }

  getActiveOrderByTable(tableId: number): ContentOrder | null {
    return this.activeOrdersByTable().get(tableId) || null;
  }

  onRefresh() {
    this.refresh.emit();
  }
}
