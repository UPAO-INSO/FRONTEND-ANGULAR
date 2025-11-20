import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';

import { KitchenNavComponent } from '@kitchen/components/kitchen-nav/kitchen-nav.component';
import { KitchenOrderListComponent } from '@kitchen/components/order-list/kitchen-order-list.component';
import { KitchenService } from '@kitchen/services/kitchen.service';

import { PartialProductUpdate } from '@products/interfaces/product.type';
import { ProductService } from '@products/services/product.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';

import { OrderService } from '@orders/services/order.service';
import { OrderStatus } from '@src/app/orders/interfaces/order.interface';
import { ServedProductOrder } from '../../components/order-card/order-card.component';

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

  onStatusChange(orderId: number, newStatus: OrderStatus) {
    this.kitchenService.updateOrderStatus(orderId, newStatus).subscribe({
      next: () => {
        this.onRefresh();
      },
      error: (error) => {
        console.error('Error updating order status:', error);
      },
    });
  }

  onServerProductOrder(served: ServedProductOrder) {
    this.kitchenService.servedProductOrder(served).subscribe({
      next: () => {
        this.onRefresh();
      },
      error: (error) => {
        console.error('Error updating served product order:', error);
      },
    });
  }

  onRefresh() {
    console.log('REFRESH');

    this.ordersResource.reload();
  }

  onRefreshProductTypes() {
    this.productTypeResource.reload();
  }
}
