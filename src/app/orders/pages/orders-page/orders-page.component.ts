import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

import { OrderService } from '../../services/order.service';
import { OrderListComponent } from '../../components/order-list/order-list.component';
import { OrderStatusComponent } from '../../components/order-list/order-header-status/order-header-status.component';
import { PaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { OrderStatus } from '../../interfaces/order.interface';

@Component({
  selector: 'app-orders-page',
  imports: [OrderListComponent, OrderStatusComponent, PaginationComponent],
  templateUrl: './orders-page.component.html',
})
export default class OrdersPageComponent {
  orderService = inject(OrderService);
  paginationService = inject(PaginationService);

  selectedOrderStatus = signal<OrderStatus | null>(null);

  orderResource = rxResource({
    params: () => ({
      status: this.selectedOrderStatus(),
      page: this.paginationService.currentPage(),
    }),

    stream: ({ params }) => {
      if (params.status !== null)
        return this.orderService.fecthOrders({
          page: params.page,
          status: params.status,
        });

      return this.orderService.fecthOrders({ page: params.page });
    },
  });
}
