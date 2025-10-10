import {
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

import { Table } from '@src/app/tables/interfaces/table.interface';
import { OrderProductTabsComponent } from '@src/app/orders/components/register-order/order-products/order-product-tabs/order-product-tabs.component';
import { OrderProductItemComponent } from '@src/app/orders/components/register-order/order-products/order-product-item/order-product-item.component';

import {
  ProductType,
  PartialProductUpdate,
} from '../../interfaces/product.type';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-change-status-product',
  imports: [OrderProductTabsComponent, OrderProductItemComponent],
  templateUrl: './change-status-product.component.html',
})
export class ChangeStatusProductComponent {
  private productService = inject(ProductService);

  selectedTable = input<Table | null | undefined>(null);
  productTypes = input.required<ProductType[]>({});

  refreshTrigger = input<number>(0);

  refresh = output<void>();
  closeModal = output<void>();

  updateProductStaus = output<PartialProductUpdate>();

  selectedCategoryId = signal<number | null>(null);

  onProductStatusUpdated(product: PartialProductUpdate) {
    this.updateProductStaus.emit(product);
  }

  constructor() {
    effect(() => {
      const trigger = this.refreshTrigger();
      if (trigger > 0) {
        this.onRefresh();
      }
    });
  }

  filteredProducts = rxResource({
    params: () => ({
      categoryId: this.selectedCategoryId(),
      refreshTrigger: this.refreshTrigger(),
    }),
    stream: ({ params }) => {
      if (!params.categoryId) return of([]);
      return this.productService.fetchProductsByTypeId(params.categoryId);
    },
  });

  onCloseModal() {
    this.closeModal.emit();
  }

  onCategorySelected(category: ProductType) {
    this.selectedCategoryId.set(category.id);
  }

  onRefresh() {
    this.filteredProducts.reload();
  }
}
