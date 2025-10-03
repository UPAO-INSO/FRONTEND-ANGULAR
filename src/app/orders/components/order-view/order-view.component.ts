import { Component, inject, input, output, signal } from '@angular/core';
import { ContentOrder, OrderStatus } from '../../interfaces/order.interface';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { Table } from 'src/app/tables/interfaces/table.interface';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-view',
  imports: [TitleCasePipe, DatePipe],
  templateUrl: './order-view.component.html',
})
export class OrderViewComponent {
  orderService = inject(OrderService);

  activeOrder = input<ContentOrder | null>(null);
  selectedTable = input<Table | null>();

  statusChange = output<{ orderId: number; newStatus: OrderStatus }>();
  orderStatus = OrderStatus;

  closeModal = output<void>();

  showConfirmModal = signal<boolean>(false);

  onStatusChange() {
    this.showConfirmModal.set(true);
  }

  confirmStatusChange() {
    const orderId = this.activeOrder()?.id;
    if (orderId) {
      this.statusChange.emit({ orderId, newStatus: OrderStatus.COMPLETED });
      this.showConfirmModal.set(false);
      this.closeModal.emit();
    }
  }

  cancelStatusChange() {
    this.showConfirmModal.set(false);
  }

  onCloseModal() {
    this.closeModal.emit();
  }

  calcSubtotal(): number {
    const order = this.activeOrder();
    if (!order || !order.productOrders) return 0;

    return order.productOrders.reduce((total, product) => {
      return total + (product.subtotal || 0);
    }, 0);
  }

  calcTax(): number {
    const subtotal = this.calcSubtotal();
    const taxRate = 0.18;
    return parseFloat((subtotal * taxRate).toFixed(2));
  }

  calcTotal(): number {
    return this.calcSubtotal() + this.calcTax();
  }

  getOrderAmPm(order: ContentOrder) {
    if (!order || !order.createdAt) return '';

    const date = new Date(order.createdAt);
    const hours = date.getHours();

    return hours >= 12 ? 'PM' : 'AM';
  }

  getColorOrderInTableStatus(order: ContentOrder) {
    switch (order.orderStatus) {
      case OrderStatus.PREPARING:
        return 'bg-status-preparing';
      case OrderStatus.PENDING:
        return 'bg-status-pending';
      case OrderStatus.READY:
        return 'bg-status-ready';
      default:
        return '';
    }
  }

  getOrderStatusText(order: ContentOrder | null): string {
    if (!order) return '';

    switch (order.orderStatus) {
      case OrderStatus.PREPARING:
        return 'Preparando';
      case OrderStatus.PENDING:
        return 'Pendiente';
      case OrderStatus.READY:
        return 'Listo';
      default:
        return '';
    }
  }
}
