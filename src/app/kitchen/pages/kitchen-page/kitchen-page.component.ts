import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import {
  ContentKitchen,
  KitchenOrderStatus,
} from '../../interfaces/kitchen-order.interface';
import { KitchenService } from '../../services/kitchen.service';
import { KitchenOrderListComponent } from '../../components/order-list/kitchen-order-list.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';

@Component({
  selector: 'app-kitchen-page',
  imports: [KitchenOrderListComponent, PaginationComponent],
  templateUrl: './kitchen-page.component.html',
})
export default class KitchenPageComponent {
  private kitchenService = inject(KitchenService);
  paginationService = inject(PaginationService);

  ordersResource = rxResource({
    params: () => ({ page: this.paginationService.currentPage() }),

    stream: ({ params }) => {
      return this.kitchenService.fetchActiveOrders({ page: params.page }) ?? [];
    },
  });

  onStatusChange(orderId: number, newStatus: KitchenOrderStatus) {
    this.kitchenService.updateOrderStatus(orderId, newStatus).subscribe({
      next: () => {
        this.ordersResource.reload();
      },
      error: (error) => {
        console.error('Error updating order status:', error);
      },
    });
  }

  getActiveOrders(orders: ContentKitchen[]) {
    return (
      orders.filter((order) => order.orderStatus !== KitchenOrderStatus.READY)
        .length ?? 0
    );
  }

  onRefresh() {
    this.ordersResource.reload();
  }
}
