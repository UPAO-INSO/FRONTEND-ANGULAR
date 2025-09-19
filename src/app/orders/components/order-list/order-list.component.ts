import { Component, input } from '@angular/core';
import { Order } from '../../interfaces/order.interface';
import { ReplaceUnderscorePipe } from 'src/app/shared/pipes/replace-underscore.pipe';
import { DatePipe, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-order-list',
  imports: [ReplaceUnderscorePipe, TitleCasePipe, DatePipe],
  templateUrl: './order-list.component.html',
})
export class OrderListComponent {
  orders = input.required<Order[]>({});
  filterOrders = input.required<Order[]>({});

  isEmpty = input<boolean>(false);
  isLoading = input<boolean>(false);
  errorMessage = input<string | unknown | null>();

  filterIsEmpty = input<boolean>(false);
  filterIsLoading = input<boolean>(false);

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
