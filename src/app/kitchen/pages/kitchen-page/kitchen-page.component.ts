import { Component, inject, signal, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';

import { KitchenNavComponent } from '@kitchen/components/kitchen-nav/kitchen-nav.component';
import { KitchenOrderListComponent } from '@kitchen/components/order-list/kitchen-order-list.component';
import { KitchenService } from '@kitchen/services/kitchen.service';

import { PartialProductUpdate } from '@products/interfaces/product.type';
import { ProductService } from '@products/services/product.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';

import { OrderService } from '@orders/services/order.service';
import { OrderStatus, UUID } from '@src/app/orders/interfaces/order.interface';
import { ServedProductOrder } from '../../components/order-card/order-card.component';
import { OrderSyncService } from '@src/app/shared/services/order-sync.service';

@Component({
  selector: 'app-kitchen-page',
  imports: [KitchenOrderListComponent, KitchenNavComponent],
  templateUrl: './kitchen-page.component.html',
})
export default class KitchenPageComponent {
  private kitchenService = inject(KitchenService);
  private paginationService = inject(PaginationService);
  private productService = inject(ProductService);
  private orderService = inject(OrderService);
  private orderSyncService = inject(OrderSyncService);

  refreshProductsTrigger = signal(0);
  tableNumber = signal<number | null>(null);
  currentPage = computed(() => this.paginationService.currentPage());

  constructor() {
    this.orderSyncService.orderUpdates$.subscribe((update) => {
      this.onRefresh();
    });
  }

  ordersResource = rxResource({
    params: () => ({
      page: this.paginationService.currentPage(),
      tableNumber: this.tableNumber(),
    }),

    stream: ({ params }) => {
      if (params.tableNumber !== null && params.tableNumber !== 0) {
        return this.orderService.searchByTableNumber(
          { page: params.page },
          params.tableNumber
        );
      }

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

  onStatusChange(orderId: UUID, newStatus: OrderStatus) {
    this.kitchenService.updateOrderStatus(orderId, newStatus).subscribe({
      next: () => {
        this.onRefresh();
        this.orderSyncService.notifyStatusChange(orderId);
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
        this.orderSyncService.notifyProductChange(served.orderId);
      },
      error: (error) => {
        console.error('Error updating served product order:', error);
      },
    });
  }

  onRefresh() {
    this.orderService.clearCache();
    this.kitchenService.clearCache();
    this.ordersResource.reload();
  }

  onRefreshProductTypes() {
    this.productTypeResource.reload();
  }
}
