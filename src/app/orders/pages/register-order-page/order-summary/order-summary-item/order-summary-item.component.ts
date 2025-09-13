import { Component, input } from '@angular/core';

@Component({
  selector: 'app-order-summary-item',
  imports: [],
  templateUrl: './order-summary-item.component.html',
})
export class OrderSummaryItemComponent {
  productSummary = input<any>();
}
