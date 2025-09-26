import { Component, input, signal } from '@angular/core';
import { NgClass } from '@angular/common';

import { TableListItemComponent } from './table-list-item/table-list-item.component';
import { RegisterOrderComponent } from 'src/app/orders/components/register-order/register-order.component';

import type { Table, TableStatus } from '../../interfaces/table.interface';
import { OrderStatus } from 'src/app/orders/interfaces/order.interface';
import { ProductType } from 'src/app/products/interfaces/product.type';

@Component({
  selector: 'app-table-list',
  imports: [TableListItemComponent, RegisterOrderComponent],
  templateUrl: './table-list.component.html',
})
export class TableListComponent {
  tables = input.required<Table[]>({});
  filterTables = input.required<Table[]>({});

  productTypes = input.required<ProductType[]>({});

  isEmpty = input<boolean>(false);
  isLoading = input<boolean>(false);
  filterIsLoading = input<boolean>(false);
  errorMessage = input<string | unknown | null>();

  orderStatus = input<OrderStatus>();
  tableStatusEnum = input.required<typeof TableStatus>();

  selectedTable = signal<Table | null>(null);
  selectedProductCategory = signal<ProductType | null>(null);

  openRegisterOrder(table: Table) {
    this.selectedTable.set(table);
  }

  closeRegisterOrder() {
    this.selectedTable.set(null);
  }
}
