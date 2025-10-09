import { Component, input, output, signal } from '@angular/core';

import { TableListItemComponent } from './table-list-item/table-list-item.component';
import { RegisterOrderComponent } from 'src/app/orders/components/register-order/register-order.component';

import type {
  ContentTable,
  Table,
  TableStatus,
} from '../../interfaces/table.interface';
import {
  ContentOrder,
  OrderStatus,
  RequestOrder,
} from 'src/app/orders/interfaces/order.interface';
import { ProductType } from 'src/app/products/interfaces/product.type';
import { OrderViewComponent } from 'src/app/orders/components/order-view/order-view.component';
import { KitchenOrderStatus } from '@kitchen/interfaces/kitchen-order.interface';

@Component({
  selector: 'app-table-list',
  imports: [TableListItemComponent, RegisterOrderComponent, OrderViewComponent],
  templateUrl: './table-list.component.html',
})
export class TableListComponent {
  tables = input.required<ContentTable[]>();
  activeOrdersByTable = input<Map<number, ContentOrder>>(new Map());

  productTypes = input.required<ProductType[]>({});

  isEmpty = input<boolean>(false);
  isLoading = input<boolean>(false);
  errorMessage = input<string | unknown | null>();

  orderStatus = input<OrderStatus>();
  tableStatusEnum = input.required<typeof TableStatus>();

  statusChange = output<{
    orderId: number;
    newStatus: OrderStatus | KitchenOrderStatus;
  }>();
  refresh = output<void>();
  orderCreated = output<RequestOrder>();
  productNameQuery = output<string>();

  selectedTable = signal<Table | null>(null);
  selectedProductCategory = signal<ProductType | null>(null);

  productName(name: string) {
    this.productNameQuery.emit(name);
  }

  onChangeStatus(orderId: number, newStatus: OrderStatus | KitchenOrderStatus) {
    this.statusChange.emit({ orderId, newStatus });
  }

  onOrderCreated(orderData: RequestOrder) {
    this.orderCreated.emit(orderData);
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
