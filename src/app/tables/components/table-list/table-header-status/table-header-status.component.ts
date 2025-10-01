import { Component, output, signal } from '@angular/core';
import { Table, TableStatus } from '../../../interfaces/table.interface';

@Component({
  selector: 'app-table-header-status',
  imports: [],
  templateUrl: './table-header-status.component.html',
})
export class TableHeaderStatusComponent {
  status = output<TableStatus | null>();

  selectedStatus = signal<TableStatus | null>(null);

  tableStatus = TableStatus;

  selectStatus(newStatus: TableStatus | null) {
    this.selectedStatus.set(newStatus);
    this.status.emit(newStatus);
  }
}
