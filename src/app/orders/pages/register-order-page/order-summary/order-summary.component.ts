import { Component } from '@angular/core';
import { OrderSummaryItemComponent } from './order-summary-item/order-summary-item.component';
import { OrderSummaryTotalComponent } from './order-summary-total/order-summary-total.component';

@Component({
  selector: 'app-order-summary',
  imports: [OrderSummaryItemComponent, OrderSummaryTotalComponent],
  templateUrl: './order-summary.component.html',
})
export class OrderSummaryComponent {
  productsSummary = [
    {
      id: 1,
      name: 'Product 1',
      quantity: 2,
      price: 10.0,
      subtotal: 20.0,
    },
    {
      id: 2,
      name: 'Product 2',
      quantity: 2,
      price: 10.0,
      subtotal: 20.0,
    },
    {
      id: 3,
      name: 'Product 3',
      quantity: 2,
      price: 10.0,
      subtotal: 20.0,
    },
    {
      id: 4,
      name: 'Product 4',
      quantity: 2,
      price: 10.0,
      subtotal: 20.0,
    },
    {
      id: 5,
      name: 'Product 5',
      quantity: 2,
      price: 10.0,
      subtotal: 20.0,
    },
    {
      id: 6,
      name: 'Product 6',
      quantity: 2,
      price: 10.0,
      subtotal: 20.0,
    },
  ];
}
