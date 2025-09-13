import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { TableService } from 'src/app/tables/services/table.service';

@Component({
  selector: 'app-pagination',
  imports: [],
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {
  tableService = inject(TableService);

  page = signal(1);

  setPage(page: number) {
    if (page < 1) return;
    if (page > this.tableService.totalPages()) return;

    this.tableService.setPage(page);
    this.page.set(page);
  }
}
