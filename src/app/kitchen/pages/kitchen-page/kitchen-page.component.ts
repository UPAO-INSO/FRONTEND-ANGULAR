import { Component, inject, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import {
  ContentKitchen,
  KitchenOrderStatus,
} from '../../interfaces/kitchen-order.interface';
import { KitchenService } from '../../services/kitchen.service';
import { KitchenOrderListComponent } from '../../components/order-list/kitchen-order-list.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { KitchenNavComponent } from '../../components/kitchen-nav/kitchen-nav.component';
import { ProductService } from 'src/app/products/services/product.service';
import { tap } from 'rxjs';
import { PartialProductUpdate } from 'src/app/products/interfaces/product.type';
import { ChangeStatusProductComponent } from 'src/app/products/components/change-status-product/change-status-product.component';

@Component({
  selector: 'app-kitchen-page',
  imports: [KitchenOrderListComponent, KitchenNavComponent],
  templateUrl: './kitchen-page.component.html',
})
export default class KitchenPageComponent {
  private kitchenService = inject(KitchenService);
  paginationService = inject(PaginationService);
  productService = inject(ProductService);

  // kitchenNavComponent = viewChild(KitchenNavComponent);

  refreshProductsTrigger = signal(0);

  ordersResource = rxResource({
    params: () => ({ page: this.paginationService.currentPage() }),

    stream: ({ params }) => {
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
        // this.kitchenNavComponent()?.onRefreshFilteredProducts();
        this.refreshProductsTrigger.set(this.refreshProductsTrigger() + 1);
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
