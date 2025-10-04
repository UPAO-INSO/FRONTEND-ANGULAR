import { Component, computed, input } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { ContentOrder, OrderStatus } from '../../interfaces/order.interface';

@Component({
  selector: 'app-order-list',
  imports: [TitleCasePipe, DatePipe],
  templateUrl: './order-list.component.html',
})
export class OrderListComponent {
  orders = input.required<ContentOrder[]>({});

  isEmpty = input<boolean>(false);
  isLoading = input<boolean>(false);
  errorMessage = input<string | unknown | null>();

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

  displayState = computed(() => {
    if (this.isLoading()) return 'loading';
    if (this.errorMessage()) return 'error';
    if (this.orders().length > 0) return 'success';
    return 'empty';
  });

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
        return { class: 'text-gray-400 font-bold', text: status };
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
      default:
        return { class: 'bg-gray-300', text: status };
    }
  }
}
