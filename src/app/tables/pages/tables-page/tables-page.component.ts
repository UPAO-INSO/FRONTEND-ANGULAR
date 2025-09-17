import { Component, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

import { TableListComponent } from '../../components/table-list/table-list.component';
import { TableHeaderStatusComponent } from '../../components/table-list/table-header-status/table-header-status.component';
import { PaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { TableService } from '../../services/table.service';

@Component({
  selector: 'app-orders-page',
  imports: [
    TableListComponent,
    TableHeaderStatusComponent,
    PaginationComponent,
  ],
  templateUrl: './tables-page.component.html',
})
export class TablesPageComponent {
  tableService = inject(TableService);

  tableStatus = signal('');

  tableResource = rxResource({
    params: () => ({
      page: this.tableService.page(),
    }),
    stream: ({ params }) => {
      if (!params.page) return of([]);

      return this.tableService.fetchTables(params.page);
    },
  });

  filterTableResource = rxResource({
    params: () => ({ query: this.tableStatus() }),

    stream: ({ params }) => {
      if (!params.query) return of([]);

      return this.tableService.fetchFilterTables(params.query);
    },
  });
}
