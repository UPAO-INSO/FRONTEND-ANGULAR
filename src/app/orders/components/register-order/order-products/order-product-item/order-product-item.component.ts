import { LowerCasePipe, TitleCasePipe } from '@angular/common';
import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  PartialProductUpdate,
  Product,
  ProductsType,
} from '@src/app/products/interfaces/product.type';

interface CategoryVisual {
  icon:     string;
  gradient: string;   // CSS gradient inline style value
  iconCss:  string;   // color CSS value for the icon
}

const CATEGORY_VISUAL: Record<string, CategoryVisual> = {
  [ProductsType.ENTRADAS]:     { icon: 'fa-solid fa-leaf',        gradient: 'from oklch(0.55 0.14 160) to oklch(0.30 0.08 160)',  iconCss: 'oklch(0.75 0.16 160)' },
  [ProductsType.SEGUNDOS]:     { icon: 'fa-solid fa-bowl-food',   gradient: 'from oklch(0.60 0.14  55) to oklch(0.30 0.08  55)', iconCss: 'oklch(0.80 0.14  55)' },
  [ProductsType.BEBIDAS]:      { icon: 'fa-solid fa-glass-water', gradient: 'from oklch(0.55 0.14 240) to oklch(0.30 0.08 240)', iconCss: 'oklch(0.75 0.16 240)' },
  [ProductsType.DESCARTABLES]: { icon: 'fa-solid fa-box',         gradient: 'from oklch(0.45 0.02 265) to oklch(0.25 0.01 265)', iconCss: 'oklch(0.65 0.03 265)' },
  [ProductsType.CARTA]:        { icon: 'fa-solid fa-book-open',   gradient: 'from oklch(0.55 0.20 303) to oklch(0.30 0.10 303)', iconCss: 'oklch(0.75 0.22 303)' },
};

const FALLBACK_VISUAL: CategoryVisual = {
  icon:     'fa-solid fa-utensils',
  gradient: 'from oklch(0.50 0.18 303) to oklch(0.28 0.10 303)',
  iconCss:  'oklch(0.70 0.20 303)',
};

@Component({
  selector: 'app-order-product-item',
  imports: [TitleCasePipe, LowerCasePipe],
  templateUrl: './order-product-item.component.html',
})
export class OrderProductItemComponent {
  product  = input.required<Product>();
  isKitchen = input<boolean>(false);
  updateProductStatus = output<PartialProductUpdate>();

  isUpdating = signal(false);

  isProductAvailable = computed(() => this.product().available);

  visual = computed<CategoryVisual>(() => {
    const type = this.product().productTypeName?.toUpperCase();
    return CATEGORY_VISUAL[type ?? ''] ?? FALLBACK_VISUAL;
  });

  textStatusProduct = computed(() =>
    this.product().available ? 'Disponible' : 'No disponible'
  );

  getColorProductStatus = computed(() =>
    this.product().available ? 'text-status-ready' : 'text-status-cancelled'
  );

  /**
   * Prioridad de imagen:
   * 1. imageUrl del backend (S3: products/{slug}.webp)
   * 2. Asset local como respaldo (assets/products/{slug}.webp)
   */
  getProductImageSrc(): string {
    if (this.product().imageUrl) return this.product().imageUrl!;
    const name = this.product().name ?? '';
    if (!name) return 'assets/products/placeholder.webp';
    return `assets/products/${this.slugify(name)}.webp`;
  }

  onImgError(ev: Event): void {
    const img = ev.target as HTMLImageElement;
    // Si S3 falla, intentar con el asset local
    const local = `assets/products/${this.slugify(this.product().name ?? '')}.webp`;
    if (img.src !== window.location.origin + '/' + local) {
      img.src = local;
    } else {
      img.src = 'assets/products/placeholder.webp';
    }
  }

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/[^a-z0-9ñ]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  onSubmitProductStatus() {
    if (this.isUpdating()) return;
    this.isUpdating.set(true);
    this.updateProductStatus.emit({ id: this.product().id, available: !this.product().available });
    setTimeout(() => this.isUpdating.set(false), 500);
  }
}
