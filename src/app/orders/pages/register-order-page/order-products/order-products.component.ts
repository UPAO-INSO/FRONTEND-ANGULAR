import { Component } from '@angular/core';
import { OrderProductItemComponent } from './order-product-item/order-product-item.component';
import { OrderProductTabsComponent } from './order-product-tabs/order-product-tabs.component';

@Component({
  selector: 'app-order-products',
  imports: [OrderProductItemComponent, OrderProductTabsComponent],
  templateUrl: './order-products.component.html',
})
export class OrderProductsComponent {
  products = [
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
