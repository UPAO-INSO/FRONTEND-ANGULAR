import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { OrderService } from '../../services/order.service';
import { OrderListComponent } from '../../components/order-list/order-list.component';
import { OrderStatusComponent } from '../../components/order-header-status/order-header-status.component';
import { OrderStatus, UUID } from '../../interfaces/order.interface';

import { PaginationComponent } from '@src/app/shared/components/pagination/pagination.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { OrderSyncService } from '@src/app/shared/services/order-sync.service';
import { CulqiService } from '@src/app/shared/services/culqi.service';

enum Direction {
  ASC = 'ASC',
  DESC = 'DESC',
}

@Component({
  selector: 'app-orders-page',
  imports: [OrderListComponent, OrderStatusComponent, PaginationComponent],
  templateUrl: './orders-page.component.html',
})
export default class OrdersPageComponent {
  orderService = inject(OrderService);
  paginationService = inject(PaginationService);
  private orderSyncService = inject(OrderSyncService);
  private culqiService = inject(CulqiService);

  selectedOrderStatus = signal<OrderStatus | null>(null);
  tableNumber = signal<number | null>(null);

  constructor() {
    this.orderSyncService.orderUpdates$.subscribe((update) => {
      console.log('Order updated:', update);
      this.refreshResources();
    });
  }

  onStatusChange(orderId: UUID, newStatus: OrderStatus) {
    this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
      next: (response) => {
        this.orderSyncService.notifyStatusChange(orderId);

        if (newStatus === OrderStatus.PAID) {
          console.log(`💳 Limpiando orden Culqi para orden #${orderId}`);
          this.culqiService.removeCulqiOrder(orderId);
        }

        this.refreshResources();
      },
      error: (error) => {
        console.error('Error change order:', error);
      },
    });
  }

  refreshResources() {
    this.orderService.clearCache();
    this.orderResource.reload();
  }

  orderResource = rxResource({
    params: () => ({
      status: this.selectedOrderStatus(),
      page: this.paginationService.currentPage(),
      direction: Direction.DESC,
      sortField: 'createdAt',
      tableNumber: this.tableNumber(),
    }),

    stream: ({ params }) => {
      if (params.tableNumber !== null && params.tableNumber !== 0)
        return this.orderService.searchByTableNumber(
          { page: params.page, limit: 5 },
          params.tableNumber
        );

      if (params.status !== null)
        return this.orderService.fecthOrders({
          page: params.page,
          status: params.status,
        });

      return this.orderService.fetchAtmOrders({
        page: params.page,
        direction: params.direction,
        sortField: params.sortField,
      });
    },
  });
}
