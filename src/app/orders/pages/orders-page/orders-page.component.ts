import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { OrderService } from '../../services/order.service';
import { OrderListComponent } from '../../components/order-list/order-list.component';
import { OrderStatusComponent } from '../../components/order-header-status/order-header-status.component';
import { PaginationComponent } from '@src/app/shared/components/pagination/pagination.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { OrderStatus } from '../../interfaces/order.interface';
import { KitchenOrderStatus } from '@kitchen/interfaces/kitchen-order.interface';

@Component({
  selector: 'app-orders-page',
  imports: [OrderListComponent, OrderStatusComponent, PaginationComponent],
  templateUrl: './orders-page.component.html',
})
export default class OrdersPageComponent {
  orderService = inject(OrderService);
  paginationService = inject(PaginationService);

  selectedOrderStatus = signal<OrderStatus | null>(null);
  tableNumber = signal<number | null>(null);

  onStatusChange(orderId: number, newStatus: OrderStatus | KitchenOrderStatus) {
    this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
      next: (response) => {
        this.refreshResources();
      },
      error: (error) => {
        console.error('Error change order:', error);
      },
    });
  }

  refreshResources() {
    this.orderResource.reload();
  }

  orderResource = rxResource({
    params: () => ({
      status: this.selectedOrderStatus(),
      page: this.paginationService.currentPage(),
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

      return this.orderService.fetchAtmOrders({ page: params.page });
    },
  });
}
