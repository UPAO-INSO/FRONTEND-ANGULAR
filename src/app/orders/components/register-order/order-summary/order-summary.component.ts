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
import { firstValueFrom } from 'rxjs';
import { Table } from '@src/app/tables/interfaces/table.interface';
import { OrderCartService } from '@src/app/orders/services/order-cart.service';
import { TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PersonByFullName,
  PersonResponse,
  RequestOrder,
  RequestOrderEmployee,
  RequestProductOrder,
} from '@src/app/orders/interfaces/order.interface';
import { OrderMapper } from '@src/app/orders/mapper/order.mapper';
import { User } from '@auth/interfaces/user.interfaces';
import { OrderService } from '@src/app/orders/services/order.service';

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
  private orderService = inject(OrderService);

  createOrder = output<RequestOrder>();
  searchFullName = output<PersonByFullName>();

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

  async onSubmitOrder() {
    if (this._user() === null) return;

    const personRequest: PersonByFullName = {
      name: this._user()?.name!,
      lastname: this._user()?.lastname!,
    };
    const person: PersonResponse = await firstValueFrom(
      this.orderService.searchPersonByFullName(personRequest)
    );

    const orderEmployees: RequestOrderEmployee[] = [
      {
        employeeId: person.id,
      },
    ];

    const productOrders: RequestProductOrder[] =
      OrderMapper.mapCartItemsToRequestProductsOrder(this.cartItems());

    if (orderEmployees.length === 0 || productOrders.length === 0) return;

    const orderData: RequestOrder = {
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
