import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of, tap } from 'rxjs';

import { PaginationComponent } from '@src/app/shared/components/pagination/pagination.component';
import { ProductService } from '@src/app/products/services/product.service';
import { OrderService } from '@src/app/orders/services/order.service';
import {
  ContentOrder,
  OrderStatus,
  RequestOrder,
} from '@src/app/orders/interfaces/order.interface';

import { PaginationService } from '@shared/components/pagination/pagination.service';

import { TableService } from '../../services/table.service';
import { TableStatus } from '../../interfaces/table.interface';
import { TableListComponent } from '../../components/table-list/table-list.component';
import { TableHeaderStatusComponent } from '../../components/table-list/table-header-status/table-header-status.component';

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
  private orderService = inject(OrderService);
  paginationService = inject(PaginationService);

  selectedTableStatus = signal<TableStatus | null>(null);
  productNameQuery = signal<string | null>(null);
  modifyStatusChanged = signal<boolean>(false);

  private currentTableIds = signal<number[]>([]);

  tablesResource = rxResource({
    params: () => ({
      status: this.selectedTableStatus(),
      page: this.paginationService.currentPage(),
    }),

    stream: ({ params }) => {
      if (params.status !== null)
        return this.tableService.fetchTables({
          status: params.status,
          page: params.page,
        });

      return this.tableService.fetchTables({ page: params.page });
    },
  });

  private syncTableIdsEffect = effect(() => {
    const tablesData = this.tablesResource.value();
    const isLoading = this.tablesResource.isLoading();

    if (tablesData?.content && !isLoading) {
      const tableIds = tablesData.content.map((table) => table.id);
      this.currentTableIds.set(tableIds);
    } else if (!isLoading) {
      this.currentTableIds.set([]);
    }
  });

  activeOrdersResource = rxResource({
    params: () => {
      const tablesData = this.tablesResource.value();
      const isTablesLoaded = !this.tablesResource.isLoading() && tablesData;

      return {
        tableIds: isTablesLoaded
          ? tablesData.content?.map((table) => table.id) || []
          : [],
        isTablesLoaded,
      };
    },

    stream: ({ params }) => {
      if (
        !params.isTablesLoaded ||
        !params.tableIds ||
        params.tableIds.length === 0
      ) {
        return of([]);
      }

      return this.orderService.fetchOrderByTablesIds(params.tableIds, {});
    },
  });

  activeOrdersByTable = computed(() => {
    const orders = this.activeOrdersResource.value() || [];
    const ordersByTable = new Map<number, ContentOrder>();

    orders.forEach((order) => {
      ordersByTable.set(order.tableId, order);
    });

    return ordersByTable;
  });

  productResource = rxResource({
    params: () => ({ name: this.productNameQuery() }),

    stream: ({ params }) => {
      if (params.name !== null)
        return this.productService.fetchProductsByNameContainig(params.name);

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

  onModifyStatusChanged(status: boolean) {
    this.modifyStatusChanged.set(status);
  }

  getActiveOrderByTable(tableId: number): ContentOrder | null {
    return this.activeOrdersByTable().get(tableId) || null;
  }

  onRefresh() {
    this.tableService.clearCache();
    this.tablesResource.reload();
    this.activeOrdersResource.reload();
  }

  onOrderUpdated(id: number, order: ContentOrder) {
    this.orderService.updateOrder(id, order).subscribe({
      next: () => {
        this.refreshResources();
      },
      error: (error) => {
        console.error('Error creating order:', error);
      },
    });
  }

  onOrderCreated(orderData: RequestOrder) {
    this.orderService.createOrder(orderData).subscribe({
      next: () => {
        this.refreshResources();
      },
      error: (error) => {
        console.error('Error creating order:', error);
      },
    });
  }

  onStatusChange(orderId: number, newStatus: OrderStatus) {
    this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
      next: (response) => {
        this.refreshResources();
      },
      error: (error) => {
        console.error('Error change order:', error);
      },
    });
  }

  private refreshResources() {
    this.tableService.clearCache();
    this.tablesResource.reload();
    this.activeOrdersResource.reload();
  }
}
