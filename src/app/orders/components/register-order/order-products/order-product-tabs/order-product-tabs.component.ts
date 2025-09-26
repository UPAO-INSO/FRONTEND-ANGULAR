import { TitleCasePipe } from '@angular/common';
import {
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { ProductType } from 'src/app/products/interfaces/product.type';

@Component({
  selector: 'app-order-product-tabs',
  imports: [TitleCasePipe],
  templateUrl: './order-product-tabs.component.html',
})
export class OrderProductTabsComponent {
  productCategories = input.required<ProductType[]>();

  private _selectedCategory = signal<ProductType | null>(null);

  selectedCategory = computed(() => {
    const userSelected = this._selectedCategory();
    if (userSelected) return userSelected;

    const categories = this.productCategories();
    return categories.length > 0 ? categories[0] : null;
  });

  categorySelected = output<ProductType>();

  constructor() {
    effect(() => {
      const defaultCategory = this.selectedCategory();
      if (defaultCategory && this._selectedCategory() === null) {
        this.categorySelected.emit(defaultCategory);
      }
    });
  }

  selectCategory(category: ProductType) {
    this._selectedCategory.set(category);
    this.categorySelected.emit(category);
  }
}
