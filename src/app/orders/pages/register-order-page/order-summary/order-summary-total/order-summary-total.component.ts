import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-order-summary-total',
  imports: [],
  templateUrl: './order-summary-total.component.html',
})
export class OrderSummaryTotalComponent {
  productsSummary = input<any>();

  subtotal = signal(0);
  tax = this.getTax(this.subtotal());
  total = this.getTotal(this.subtotal(), this.tax);

  getSubtotal(productsSummary: any) {
    this.subtotal = productsSummary.reduce(
      (acc: number, item: any) => acc + item.subtotal,
      0
    );
  }

  getTax(subtotal: number) {
    return subtotal * 0.18; // Assuming an 18% tax rate
  }

  getTotal(subtotal: number, tax: number) {
    return subtotal + tax;
  }
}
