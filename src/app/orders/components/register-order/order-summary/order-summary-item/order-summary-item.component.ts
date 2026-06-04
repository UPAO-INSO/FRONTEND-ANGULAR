import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import {
  CartItem,
  OrderCartService,
} from '@src/app/orders/services/order-cart.service';

@Component({
  selector: 'app-order-summary-item',
  imports: [TitleCasePipe],
  templateUrl: './order-summary-item.component.html',
})
export class OrderSummaryItemComponent {
  private orderCartService = inject(OrderCartService);
  cartItem = input.required<CartItem>();

  updateQuantity = output<number>();
  removeItem = output<void>();

  modificationStatus = computed(() => {
    const item = this.cartItem();
    return this.orderCartService.canModifyProduct(item.product.id);
  });

  isFullyServed = computed(() => {
    const item = this.cartItem();
    const servedQty = item.servedQuantity || 0;
    return servedQty === item.quantity;
  });

  availableQuantity = computed(() => {
    const item = this.cartItem();
    const servedQty = item.servedQuantity || 0;
    return item.quantity - servedQty;
  });

  onQuantityChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const quantity = parseInt(target.value, 10);
    const servedQty = this.cartItem().servedQuantity || 0;

    if (quantity >= servedQty) {
      this.updateQuantity.emit(quantity);
    }
  }

  increaseQuantity() {
    this.updateQuantity.emit(this.cartItem().quantity + 1);
  }

  decreaseQuantity() {
    const item = this.cartItem();
    const servedQty = item.servedQuantity || 0;
    const newQuantity = item.quantity - 1;

    if (newQuantity > servedQty) {
      this.updateQuantity.emit(newQuantity);
    } else if (newQuantity === servedQty && servedQty === 0) {
      this.removeItem.emit();
    }
  }

  onRemove() {
    const servedQty = this.cartItem().servedQuantity || 0;
    if (servedQty === 0) {
      this.removeItem.emit();
    }
  }
}
