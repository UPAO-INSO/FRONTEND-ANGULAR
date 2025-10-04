import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import {
  ContentOrder,
  OrderStatus,
} from 'src/app/orders/interfaces/order.interface';

@Component({
  selector: 'app-order-list-item',
  imports: [TitleCasePipe, DatePipe],
  templateUrl: './order-list-item.component.html',
})
export class OrderListItemComponent {
  order = input.required<ContentOrder>();

  colorStatus = computed;

  orderSelected = output<ContentOrder>();

  onOrderClick() {
    this.orderSelected.emit(this.order());
  }

  getOrderAmPm(order: ContentOrder) {
    if (!order || !order.createdAt) return '';

    const date = new Date(order.createdAt);
    const hours = date.getHours();

    return hours >= 12 ? 'PM' : 'AM';
  }

  getProductsDisplayText(productOrders: any[]): string {
    if (!productOrders || productOrders.length === 0) {
      return 'Sin productos';
    }

    const productNames = productOrders.map(
      (po) => `${po.quantity}x ${po.productName || 'Producto'}`
    );

    return productNames.join(', ');
  }

  getProductsFullText(productOrders: any[]): string {
    if (!productOrders || productOrders.length === 0) {
      return 'Sin productos';
    }

    const productNames = productOrders.map(
      (po) => `${po.quantity}x ${po.productName || 'Producto'}`
    );

    return `Productos: ${productNames.join(', ')}`;
  }

  getTextStatus(status: OrderStatus) {
    switch (status) {
      case OrderStatus.PENDING:
        return 'Pendiente';
      case OrderStatus.PREPARING:
        return 'Preparando';
      case OrderStatus.READY:
        return 'Listo';
      case OrderStatus.PAID:
        return 'Pagado';
      case OrderStatus.COMPLETED:
        return 'Completado';
      case OrderStatus.CANCELLED:
        return 'Cancelado';
    }
  }

  getHoverBackgroundColor(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-gradient-to-r from-status-pending to-side-background';
      case OrderStatus.PREPARING:
        return 'bg-gradient-to-r from-status-preparing to-transparent';
      case OrderStatus.READY:
        return 'bg-gradient-to-r from-status-ready to-transparent';
      case OrderStatus.CANCELLED:
        return 'bg-gradient-to-r from-status-cancelled to-transparent';
      case OrderStatus.PAID:
        return 'bg-gradient-to-r from-status-paid to-transparent';
      default:
        return 'bg-gradient-to-r from-status-completed to-transparent';
    }
  }

  getOrderStatus(status: OrderStatus): { class: string; text: string } {
    switch (status) {
      case OrderStatus.PENDING:
        return { class: 'text-status-pending font-bold', text: status };
      case OrderStatus.PREPARING:
        return {
          class: 'text-status-preparing font-bold',
          text: status,
        };
      case OrderStatus.PAID:
        return { class: ' text-status-paid font-bold', text: status };
      case OrderStatus.READY:
        return { class: ' text-status-ready font-bold', text: status };
      case OrderStatus.CANCELLED:
        return {
          class: 'text-status-cancelled font-bold',
          text: status,
        };
      default:
        return { class: 'text-status-completed font-bold', text: status };
    }
  }

  getBorderOrderStatus(status: OrderStatus) {
    switch (status) {
      case OrderStatus.PENDING:
        return 'border-status-pending ';
      case OrderStatus.PREPARING:
        return 'border-status-preparing';
      case OrderStatus.PAID:
        return ' border-status-paid ';
      case OrderStatus.READY:
        return ' border-status-ready';
      case OrderStatus.CANCELLED:
        return 'border-status-cancelled';
      case OrderStatus.COMPLETED:
        return 'border-status-completed';
    }
  }
}
