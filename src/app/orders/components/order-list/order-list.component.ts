import { Component, computed, input } from '@angular/core';
import { ReplaceUnderscorePipe } from 'src/app/shared/pipes/replace-underscore.pipe';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { ContentOrder, RESTOrder } from '../../interfaces/order.interface';

@Component({
  selector: 'app-order-list',
  imports: [ReplaceUnderscorePipe, TitleCasePipe, DatePipe],
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

  getOrderStatus(status: string): { class: string; text: string } {
    switch (status) {
      case 'PENDING':
        return { class: 'badge bg-amber-500 text-white', text: status };
      case 'PREPARING':
        return {
          class: 'badge bg-blue-600 text-white',
          text: status,
        };
      case 'PAID':
        return { class: 'badge bg-purple-700 text-white', text: status };
      case 'READY':
        return { class: 'badge bg-status-ready text-white', text: status };
      case 'CANCELLED':
        return {
          class: 'badge bg-status-cancelled text-white',
          text: status,
        };
      default:
        return { class: 'badge bg-gray-500 text-white', text: status };
    }
  }
}
