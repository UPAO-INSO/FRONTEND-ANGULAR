import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

import { OrderService } from '../../services/order.service';
import { OrderListComponent } from '../../components/order-list/order-list.component';
import { OrderStatusComponent } from '../../components/order-list/order-header-status/order-header-status.component';
import { PaginationComponent } from 'src/app/shared/components/pagination/pagination.component';

@Component({
  selector: 'app-orders-page',
  imports: [OrderListComponent, OrderStatusComponent, PaginationComponent],
  templateUrl: './orders-page.component.html',
})
export default class OrdersPageComponent {
  orderService = inject(OrderService);
  orderStatus = signal('');

  orderResource = rxResource({
    stream: () => {
      const orders = this.orderService.fecthOrders();
      console.log({ orders });
      return orders;
    },
  });

  filterOrderResource = rxResource({
    params: () => ({ query: this.orderStatus() }),

    stream: ({ params }) => {
      if (!params.query) return of([]);

      return this.orderService.fetchFilterOrder(params.query);
    },
  });
}
