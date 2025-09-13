import { Component, input } from '@angular/core';

@Component({
  selector: 'app-order-product-item',
  imports: [],
  templateUrl: './order-product-item.component.html',
})
export class OrderProductItemComponent {
  product = input.required<any>();
}
