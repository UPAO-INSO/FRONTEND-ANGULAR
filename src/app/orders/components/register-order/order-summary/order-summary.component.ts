import { Component, inject, input } from '@angular/core';
import { OrderSummaryItemComponent } from './order-summary-item/order-summary-item.component';
import { OrderSummaryTotalComponent } from './order-summary-total/order-summary-total.component';
import { Table } from 'src/app/tables/interfaces/table.interface';
import { OrderCartService } from 'src/app/orders/services/order-cart.service';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-order-summary',
  imports: [
    OrderSummaryItemComponent,
    OrderSummaryTotalComponent,
    TitleCasePipe,
  ],
  templateUrl: './order-summary.component.html',
})
export class OrderSummaryComponent {
  private orderCartService = inject(OrderCartService);

  selectedTable = input<Table | null | undefined>(null);

  cartItems = this.orderCartService.cartItems;
  totalItems = this.orderCartService.totalItems;

  onUpdateQuantity(productId: number, quantity: number) {
    this.orderCartService.updateQuantity(productId, quantity);
  }

  onRemoveItem(productId: number) {
    this.orderCartService.removeProduct(productId);
  }

  // productsSummary = [
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
