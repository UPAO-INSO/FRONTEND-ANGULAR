import { Component, inject, input, output, signal } from '@angular/core';
import { ContentOrder, OrderStatus } from '../../interfaces/order.interface';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { Table } from '@src/app/tables/interfaces/table.interface';
import { KitchenOrderStatus } from '@kitchen/interfaces/kitchen-order.interface';

@Component({
  selector: 'app-order-view',
  imports: [TitleCasePipe, DatePipe],
  templateUrl: './order-view.component.html',
})
export class OrderViewComponent {
  activeOrder = input<ContentOrder | null>(null);
  selectedTable = input<Table | null>();
  textConfirm = input.required<string>();

  statusChange = output<{
    orderId: number;
    newStatus: OrderStatus | KitchenOrderStatus;
  }>();
  orderStatus = OrderStatus;

  closeModal = output<void>();

  showConfirmModal = signal<boolean>(false);

  onStatusChange() {
    this.showConfirmModal.set(true);
  }

  confirmStatusChange(status: OrderStatus | KitchenOrderStatus) {
    const orderId = this.activeOrder()?.id;
    if (orderId) {
      this.statusChange.emit({ orderId, newStatus: status });
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
      case OrderStatus.CANCELLED:
        return 'bg-status-cancelled';
      case OrderStatus.COMPLETED:
        return 'bg-status-completed';
      case OrderStatus.PAID:
        return 'bg-status-paid';
      default:
        return '';
    }
  }

  getOrderStatusText(order: ContentOrder | null) {
    if (!order) return '';

    switch (order.orderStatus) {
      case OrderStatus.PREPARING:
        return 'Preparando';
      case OrderStatus.PENDING:
        return 'Pendiente';
      case OrderStatus.READY:
        return 'Listo';
      case OrderStatus.CANCELLED:
        return 'Cancelado';
      case OrderStatus.COMPLETED:
        return 'Completado';
      case OrderStatus.PAID:
        return 'Pagado';
      default:
        return '';
    }
  }
}
