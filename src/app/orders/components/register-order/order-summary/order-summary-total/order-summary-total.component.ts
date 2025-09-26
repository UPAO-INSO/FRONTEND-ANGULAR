import { Component, computed, inject, input, signal } from '@angular/core';
import {
  OrderCartService,
  CartItem,
} from 'src/app/orders/services/order-cart.service';

@Component({
  selector: 'app-order-summary-total',
  imports: [],
  templateUrl: './order-summary-total.component.html',
})
export class OrderSummaryTotalComponent {
  private orderCartService = inject(OrderCartService);

  cartItems = input.required<CartItem[]>();

  subtotal = this.orderCartService.subtotal;
  tax = this.orderCartService.tax;
  total = this.orderCartService.total;

  onCreateOrder() {
    this.orderCartService.createOrder();
  }
}
