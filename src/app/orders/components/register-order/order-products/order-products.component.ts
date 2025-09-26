import {
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { OrderProductItemComponent } from './order-product-item/order-product-item.component';
import { OrderProductTabsComponent } from './order-product-tabs/order-product-tabs.component';
import { Table } from 'src/app/tables/interfaces/table.interface';
import { Product, ProductType } from 'src/app/products/interfaces/product.type';
import { OrderCartService } from 'src/app/orders/services/order-cart.service';
import { ProductService } from 'src/app/products/services/product.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

@Component({
  selector: 'app-order-products',
  imports: [OrderProductItemComponent, OrderProductTabsComponent],
  templateUrl: './order-products.component.html',
})
export class OrderProductsComponent {
  private orderCartService = inject(OrderCartService);
  private productService = inject(ProductService);

  selectedTable = input<Table | null | undefined>(null);
  productTypes = input.required<ProductType[]>({});

  closeModal = output<void>();

  selectedCategoryId = signal<number | null>(null);

  constructor() {
    effect(() => {
      const table = this.selectedTable();
      if (table) {
        this.orderCartService.setCurrentTable(table.id);
      }
    });
  }

  filteredProducts = rxResource({
    params: () => ({ categoryId: this.selectedCategoryId() }),
    stream: ({ params }) => {
      if (!params.categoryId) return of([]);
      return this.productService.fetchProductsByTypeId(params.categoryId);
    },
  });

  onCloseModal() {
    this.closeModal.emit();
  }

  onProductClick(product: Product) {
    this.orderCartService.addProduct(product);
  }

  onCategorySelected(category: ProductType) {
    this.selectedCategoryId.set(category.id);
  }

  // products = [
  //   {
  //     id: 1,
  //     name: 'Product 1',
  //     quantity: 2,
  //     price: 10.0,
  //     subtotal: 20.0,
  //   },
  //   {
  //     id: 2,
  //     name: 'Product 2',
  //     quantity: 2,
  //     price: 10.0,
  //     subtotal: 20.0,
  //   },
  //   {
  //     id: 3,
  //     name: 'Product 3',
  //     quantity: 2,
  //     price: 10.0,
  //     subtotal: 20.0,
  //   },
  //   {
  //     id: 4,
  //     name: 'Product 4',
  //     quantity: 2,
  //     price: 10.0,
  //     subtotal: 20.0,
  //   },
  //   {
  //     id: 5,
  //     name: 'Product 5',
  //     quantity: 2,
  //     price: 10.0,
  //     subtotal: 20.0,
  //   },
  //   {
  //     id: 6,
  //     name: 'Product 6',
  //     quantity: 2,
  //     price: 10.0,
  //     subtotal: 20.0,
  //   },
  // ];
}
