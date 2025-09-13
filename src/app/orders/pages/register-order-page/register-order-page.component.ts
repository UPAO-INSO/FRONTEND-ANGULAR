import { Component } from '@angular/core';
import { OrderProductsComponent } from './order-products/order-products.component';
import { OrderSummaryComponent } from './order-summary/order-summary.component';

@Component({
  selector: 'app-register-order',
  imports: [OrderProductsComponent, OrderSummaryComponent],
  templateUrl: './register-order-page.component.html',
})
export class RegisterOrderPageComponent {}
