import { Component, inject, input, output } from '@angular/core';
import { OrderProductsComponent } from './order-products/order-products.component';
import { OrderSummaryComponent } from './order-summary/order-summary.component';
import { Table } from 'src/app/tables/interfaces/table.interface';
import { ProductService } from 'src/app/products/services/product.service';
import { ProductType } from 'src/app/products/interfaces/product.type';

@Component({
  selector: 'app-register-order',
  imports: [OrderProductsComponent, OrderSummaryComponent],
  templateUrl: './register-order.component.html',
})
export class RegisterOrderComponent {
  productService = inject(ProductService);

  selectedTable = input<Table | null>();
  productTypes = input.required<ProductType[]>({});

  closeModal = output<void>();

  onCloseModal() {
    this.closeModal.emit();
  }
}
