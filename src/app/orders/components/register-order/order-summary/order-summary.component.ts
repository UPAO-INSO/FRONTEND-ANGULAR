import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { OrderCartService } from '@src/app/orders/services/order-cart.service';
import { Table, TableStatus } from '@src/app/tables/interfaces/table.interface';
import {
  ContentOrder,
  PersonByFullName,
  PersonResponse,
  RequestOrder,
  RequestOrderEmployee,
  RequestProductOrder,
  UUID,
} from '@src/app/orders/interfaces/order.interface';
import { OrderMapper } from '@src/app/orders/mapper/order.mapper';
import { User } from '@auth/interfaces/user.interfaces';
import { OrderService } from '@src/app/orders/services/order.service';

import { OrderSummaryItemComponent } from './order-summary-item/order-summary-item.component';
import { OrderSummaryTotalComponent } from './order-summary-total/order-summary-total.component';
import { ProductService } from '@src/app/products/services/product.service';

interface OrderUpdated {
  id: UUID;
  order: RequestOrder;
}

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
  private productService = inject(ProductService);

  createOrder = output<RequestOrder>();
  updateOrder = output<OrderUpdated>();
  searchFullName = output<PersonByFullName>();

  selectedTable = input.required<Table>();
  activeOrder = input<ContentOrder | null>();

  cartItems = this.orderCartService.cartItems;
  totalItems = this.orderCartService.totalItems;

  comment = signal<string>('');
  private orderLoadedId = signal<UUID | null>(null);
  private _user = signal<User | null>(
    localStorage.getItem('user-data')
      ? JSON.parse(localStorage.getItem('user-data')!)
      : null
  );

  carItemsLength = computed(() => this.cartItems().length);

  commentLength = computed(() => this.comment().length);

  constructor() {
    effect(() => {
      const order = this.activeOrder();
      const table = this.selectedTable();

      if (!order || !table) {
        return;
      }

      if (this.orderLoadedId() === order.id) {
        return;
      }

      this.loadOrderToCart(order, table.id);

      this.orderLoadedId.set(order.id);

      if (order.comment) {
        this.comment.set(order.comment);
      }
    });
  }

  private async loadOrderToCart(order: ContentOrder, tableId: number) {
    this.orderCartService.setCurrentTable(tableId);

    const productIds = order.productOrders.map((po) => po.productId);

    const products = await firstValueFrom(
      this.productService.fetchProductsByIds(productIds)
    );

    const productsMap = new Map(products.map((p) => [p.id, p]));

    order.productOrders.forEach((productOrder) => {
      const product = productsMap.get(productOrder.productId);

      if (product) {
        this.orderCartService.addProductWithQuantity(
          product,
          productOrder.quantity
        );
      } else {
        console.warn(
          `Producto no encontrado en DB: ID ${productOrder.productId}`
        );
      }
    });
  }

  async onSubmitOrder() {
    const activeOrder = this.activeOrder();

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
      OrderMapper.mapCartItemsToRequestProductsOrder(
        activeOrder?.id!,
        this.cartItems()
      );

    if (orderEmployees.length === 0 || productOrders.length === 0) return;

    const orderData: RequestOrder = {
      comment: this.comment(),
      orderEmployees,
      productOrders,
      tableId: this.selectedTable()?.id!,
    };

    if (this.activeOrder() !== null) {
      const id = this.activeOrder()?.id!;
      this.updateOrder.emit({ id, order: orderData });
    } else {
      this.createOrder.emit(orderData);
    }
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

  getOrderStatusText(status: TableStatus): string {
    switch (status) {
      case TableStatus.AVAILABLE:
        return 'Disponible';
      case TableStatus.OCCUPIED:
        return 'Ocupada';
      case TableStatus.RESERVED:
        return 'Reservada';
      default:
        return 'Desconocido';
    }
  }
}
