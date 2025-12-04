import { TitleCasePipe } from '@angular/common';
import {
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import {
  PartialProductUpdate,
  Product,
} from '@src/app/products/interfaces/product.type';

@Component({
  selector: 'app-order-product-item',
  imports: [TitleCasePipe],
  templateUrl: './order-product-item.component.html',
})
export class OrderProductItemComponent {
  product = input.required<Product>();

  isKitchen = input<boolean>(false);

  updateProductStatus = output<PartialProductUpdate>();

  // Estado de carga para evitar clics múltiples
  isUpdating = signal(false);

  isProductAvailable = computed(() => this.product().available);

  partialProduct = computed<PartialProductUpdate>(() => {
    const currentProduct = this.product();
    return {
      id: currentProduct.id,
      available: currentProduct.available,
    };
  });

  textStatusProduct = computed(() => {
    return this.product().available ? 'Disponible' : 'No disponible';
  });

  getColorProductStatus = computed(() => {
    return this.product().available ? 'text-green-700' : 'text-red-700';
  });

  // Imagen del producto desde assets/products con fallback
  private slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      // Mantener ñ tal cual
      .replace(/[^a-z0-9ñ]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  getProductImageSrc(): string {
    const name = this.product().name ?? '';
    if (!name) return 'assets/products/placeholder.webp';
    const slug = this.slugify(name);
    return `assets/products/${slug}.webp`;
  }

  onImgError(ev: Event): void {
    const img = ev.target as HTMLImageElement;
    img.src = 'assets/products/placeholder.webp';
  }

  onSubmitProductStatus() {
    // Evitar clics múltiples mientras se procesa
    if (this.isUpdating()) return;
    
    this.isUpdating.set(true);
    
    const currentProduct = this.product();
    const newStatus = !currentProduct.available;

    const update: PartialProductUpdate = {
      id: currentProduct.id,
      available: newStatus,
    };

    this.updateProductStatus.emit(update);
    
    // Reset después de un breve delay para permitir el próximo clic
    setTimeout(() => this.isUpdating.set(false), 500);
  }
}
