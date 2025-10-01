import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of, tap } from 'rxjs';

import { TableListComponent } from '../../components/table-list/table-list.component';
import { TableHeaderStatusComponent } from '../../components/table-list/table-header-status/table-header-status.component';
import { PaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { TableService } from '../../services/table.service';
import { ProductService } from 'src/app/products/services/product.service';
import { TableStatus } from '../../interfaces/table.interface';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { OrderService } from 'src/app/orders/services/order.service';
import {
  ContentOrder,
  OrderStatus,
} from 'src/app/orders/interfaces/order.interface';

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

  tableStatusEnum = TableStatus;
  selectedTableStatus = signal<TableStatus | null>(null);

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

    console.log({ ordersByTable });

    return ordersByTable;
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

  getActiveOrderByTable(tableId: number): ContentOrder | null {
    return this.activeOrdersByTable().get(tableId) || null;
  }

  onRefresh() {
    this.tablesResource.reload();
    this.activeOrdersResource.reload();
  }

  onStatusChange(orderId: number, newStatus: OrderStatus) {
    console.log('🎯 Tables Page - Updating order status:', {
      orderId,
      newStatus,
    });

    this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
      next: (resp) => {
        console.log('✅ Order status updated successfully:', resp);

        this.refreshResources();
      },
      error: (error) => {
        console.error('❌ Error updating order status:', error);
      },
    });
  }

  private refreshResources() {
    try {
      this.tablesResource.reload();
      this.activeOrdersResource.reload();
    } catch (error) {
      console.log('Using fallback refresh method');
      this.refreshResources();
    }
  }
}
