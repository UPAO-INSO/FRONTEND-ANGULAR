import { TitleCasePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { CartItem } from 'src/app/orders/services/order-cart.service';

@Component({
  selector: 'app-order-summary-item',
  imports: [TitleCasePipe],
  templateUrl: './order-summary-item.component.html',
})
export class OrderSummaryItemComponent {
  cartItem = input.required<CartItem>();

  updateQuantity = output<number>();
  removeItem = output<void>();

  onQuantityChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const quantity = parseInt(target.value, 10);
    if (quantity > 0) {
      this.updateQuantity.emit(quantity);
    }
  }

  increaseQuantity() {
    this.updateQuantity.emit(this.cartItem().quantity + 1);
  }

  decreaseQuantity() {
    const newQuantity = this.cartItem().quantity - 1;
    if (newQuantity > 0) {
      this.updateQuantity.emit(newQuantity);
    } else {
      this.removeItem.emit();
    }
  }

  onRemove() {
    this.removeItem.emit();
  }
}
