import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { OrderSummaryItemComponent } from './order-summary-item/order-summary-item.component';
import { OrderSummaryTotalComponent } from './order-summary-total/order-summary-total.component';
import { Table } from 'src/app/tables/interfaces/table.interface';
import { OrderCartService } from 'src/app/orders/services/order-cart.service';
import { TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  RequestOrder,
  RequestOrderEmployee,
  RequestProductOrder,
} from 'src/app/orders/interfaces/order.interface';
import { OrderEmployee } from '../../../interfaces/order.interface';
import { OrderMapper } from 'src/app/orders/mapper/order.mapper';
import { User } from '@auth/interfaces/user.interfaces';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-order-summary',
  imports: [
    OrderSummaryItemComponent,
    OrderSummaryTotalComponent,
    TitleCasePipe,
    FormsModule,
  ],
  templateUrl: './order-summary.component.html',
})
export class OrderSummaryComponent {
  private orderCartService = inject(OrderCartService);

  createOrder = output<RequestOrder>();

  selectedTable = input<Table | null | undefined>(null);

  cartItems = this.orderCartService.cartItems;
  totalItems = this.orderCartService.totalItems;
  comment = signal<string>('');

  private _user = signal<User | null>(
    localStorage.getItem('user-data')
      ? JSON.parse(localStorage.getItem('user-data')!)
      : null
  );

  carItemsLength = computed(() => this.cartItems().length);

  commentLength = computed(() => this.comment().length);

  onSubmitOrder() {
    const orderEmployees: RequestOrderEmployee[] = [
      {
        employeeId: this._user()?.id!,
      },
    ];

    const productOrders: RequestProductOrder[] =
      OrderMapper.mapCartItemsToRequestProductsOrder(this.cartItems());

    if (orderEmployees.length === 0 || productOrders.length === 0) return;

    const orderData: RequestOrder = {
      clientId: 2,
      comment: this.comment(),
      orderEmployees,
      productOrders,
      tableId: this.selectedTable()?.id!,
    };

    this.createOrder.emit(orderData);
  }

  clearCart() {
    this.orderCartService.clearCurrentTableCart();
  }

  onUpdateQuantity(productId: number, quantity: number) {
    this.orderCartService.updateQuantity(productId, quantity);
  }

  onRemoveItem(productId: number) {
    this.orderCartService.removeProduct(productId);
  }
}
