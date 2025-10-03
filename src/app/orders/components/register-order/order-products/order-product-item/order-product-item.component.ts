import { TitleCasePipe } from '@angular/common';
import {
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import {
  PartialProductUpdate,
  Product,
} from 'src/app/products/interfaces/product.type';

@Component({
  selector: 'app-order-product-item',
  imports: [TitleCasePipe],
  templateUrl: './order-product-item.component.html',
})
export class OrderProductItemComponent {
  product = input.required<Product>();

  isKitchen = input<boolean>(false);

  updateProductStatus = output<PartialProductUpdate>();

  localAvailable = signal<boolean>(true);

  constructor() {
    effect(() => {
      const currentProduct = this.product();
      this.localAvailable.set(currentProduct.available);
    });
  }

  partialProduct = computed<PartialProductUpdate>(() => {
    const currentProduct = this.product();
    return {
      id: currentProduct.id,
      available: currentProduct.available,
    };
  });

  textStatusProduct = computed(() => {
    return this.localAvailable() ? 'Disponible' : 'No disponible';
  });

  getColorProductStatus = computed(() => {
    return this.localAvailable() ? 'text-green-700' : 'text-red-700';
  });

  onSubmitProductStatus() {
    const currentProduct = this.product();
    const newStatus = !currentProduct.available;

    console.log({ currentProduct });
    console.log({ newStatus });

    const update: PartialProductUpdate = {
      id: currentProduct.id,
      available: newStatus,
    };

    this.updateProductStatus.emit(update);
  }
}
