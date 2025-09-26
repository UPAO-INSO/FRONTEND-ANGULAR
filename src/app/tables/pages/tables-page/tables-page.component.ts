import { Component, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of, tap } from 'rxjs';

import { TableListComponent } from '../../components/table-list/table-list.component';
import { TableHeaderStatusComponent } from '../../components/table-list/table-header-status/table-header-status.component';
import { PaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { TableService } from '../../services/table.service';
import { ProductService } from 'src/app/products/services/product.service';
import { TableStatus } from '../../interfaces/table.interface';

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
  productService = inject(ProductService);

  tableStatusEnum = TableStatus;
  selectedStatusFilter = signal<TableStatus | null>(null);

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
    params: () => ({ query: this.selectedStatusFilter() }),

    stream: ({ params }) => {
      if (!params.query) return of([]);

      return this.tableService.fetchFilterTables(params.query);
    },
  });

  productResource = rxResource({
    stream: () => {
      return this.productService
        .fetchProducts()
        .pipe(tap((products) => products));
    },
  });

  productTypeResource = rxResource({
    stream: () => {
      return this.productService
        .fetchProductsType()
        .pipe(tap((productTypes) => productTypes));
    },
  });
}
