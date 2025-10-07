import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';

import { KitchenNavComponent } from '@kitchen/components/kitchen-nav/kitchen-nav.component';
import { KitchenOrderListComponent } from '@kitchen/components/order-list/kitchen-order-list.component';
import { KitchenOrderStatus } from '@kitchen/interfaces/kitchen-order.interface';
import { KitchenService } from '@kitchen/services/kitchen.service';

import { PartialProductUpdate } from '@products/interfaces/product.type';
import { ProductService } from '@products/services/product.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';

import { OrderService } from '@orders/services/order.service';

@Component({
  selector: 'app-kitchen-page',
  imports: [KitchenOrderListComponent, KitchenNavComponent],
  templateUrl: './kitchen-page.component.html',
})
export default class KitchenPageComponent {
  private kitchenService = inject(KitchenService);
  paginationService = inject(PaginationService);
  productService = inject(ProductService);
  ordersService = inject(OrderService);

  refreshProductsTrigger = signal(0);
  tableNumber = signal<number | null>(null);

  ordersResource = rxResource({
    params: () => ({
      page: this.paginationService.currentPage(),
      tableNumber: this.tableNumber(),
    }),

    stream: ({ params }) => {
      if (params.tableNumber !== null && params.tableNumber !== 0)
        return this.ordersService.searchByTableNumber(
          { page: params.page },
          params.tableNumber
        );

      return this.kitchenService.fetchActiveOrders({ page: params.page }) ?? [];
    },
  });

  productTypeResource = rxResource({
    stream: () => {
      return this.productService
        .fetchProductsType()
        .pipe(tap((productTypes) => productTypes));
    },
  });

  onProductStatusUpdated(product: PartialProductUpdate) {
    this.productService.updateProduct(product).subscribe({
      next: () => {
        this.refreshProductsTrigger.set(this.refreshProductsTrigger() + 1);
        this.productService.sendMessage();
      },
      error: (error) => {
        console.error('Error updating product status:', error);
      },
    });
  }

  onStatusChange(orderId: number, newStatus: KitchenOrderStatus) {
    this.kitchenService.updateOrderStatus(orderId, newStatus).subscribe({
      next: () => {
        this.onRefresh();
      },
      error: (error) => {
        console.error('Error updating order status:', error);
      },
    });
  }

  onRefresh() {
    this.ordersResource.reload();
  }

  onRefreshProductTypes() {
    this.productTypeResource.reload();
  }
}
