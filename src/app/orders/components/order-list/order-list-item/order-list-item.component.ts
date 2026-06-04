import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';

import {
  ContentOrder,
  OrderStatus,
} from '@src/app/orders/interfaces/order.interface';
import {
  ORDER_STATUS_BORDER_CLASS,
  ORDER_STATUS_GRADIENT_CLASS,
  ORDER_STATUS_LABELS,
} from '@src/app/shared/utils/order-status.utils';
import { StatusBadgeComponent } from '@src/app/shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-order-list-item',
  imports: [TitleCasePipe, DatePipe, StatusBadgeComponent],
  templateUrl: './order-list-item.component.html',
})
export class OrderListItemComponent {
  order = input.required<ContentOrder>();
  orderSelected = output<ContentOrder>();

  readonly borderClass  = (s: OrderStatus) => ORDER_STATUS_BORDER_CLASS[s]  ?? '';
  readonly gradientClass = (s: OrderStatus) => ORDER_STATUS_GRADIENT_CLASS[s] ?? '';
  readonly statusLabel  = (s: OrderStatus) => ORDER_STATUS_LABELS[s]         ?? '';

  onOrderClick() {
    this.orderSelected.emit(this.order());
  }

  getOrderAmPm(order: ContentOrder): string {
    if (!order?.createdAt) return '';
    return new Date(order.createdAt).getHours() >= 12 ? 'PM' : 'AM';
  }

  getProductsDisplayText(productOrders: any[]): string {
    if (!productOrders?.length) return 'Sin productos';
    return productOrders.map(po => `${po.quantity}x ${po.productName ?? 'Producto'}`).join(', ');
  }
}
