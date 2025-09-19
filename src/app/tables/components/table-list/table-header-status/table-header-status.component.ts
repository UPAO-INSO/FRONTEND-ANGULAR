import { Component, output } from '@angular/core';
import { Table, TableStatus } from '../../../interfaces/table.interface';

@Component({
  selector: 'app-table-header-status',
  imports: [],
  templateUrl: './table-header-status.component.html',
})
export class TableHeaderStatusComponent {
  status = output<TableStatus | null>();

  tableStatus = TableStatus;
}
