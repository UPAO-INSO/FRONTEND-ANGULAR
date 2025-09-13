import { Component, input, signal } from '@angular/core';
import { Table, TableStatus } from '../../interfaces/table.interface';
import { TableListItemComponent } from './table-list-item/table-list-item.component';
import { OrderStatus } from 'src/app/orders/interfaces/order.interface';

@Component({
  selector: 'app-table-list',
  imports: [TableListItemComponent],
  templateUrl: './table-list.component.html',
})
export class TableListComponent {
  tables = input.required<Table[]>({});
  filterTables = input.required<Table[]>({});
  orderStatus = input<OrderStatus>();

  isEmpty = input<boolean>(false);
  isLoading = input<boolean>(false);
  errorMessage = input<string | unknown | null>();

  filterIsEmpty = input<boolean>(false);
  filterIsLoading = input<boolean>(false);

  tableStatus = TableStatus;
}
