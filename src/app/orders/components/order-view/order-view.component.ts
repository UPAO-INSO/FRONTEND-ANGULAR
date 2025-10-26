import { Component, inject, input, output, signal } from '@angular/core';
import { ContentOrder, OrderStatus } from '../../interfaces/order.interface';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { Table } from '@src/app/tables/interfaces/table.interface';

@Component({
  selector: 'app-order-view',
  imports: [TitleCasePipe, DatePipe],
  templateUrl: './order-view.component.html',
})
export class OrderViewComponent {
  selectedTable = input<Table | null>();
  activeOrder = input.required<ContentOrder>();
  isAtm = input.required<boolean>();
  textConfirm = input.required<string>();
  changeStatusQuery = input.required<OrderStatus>();

  statusChange = output<{
    orderId: number;
    newStatus: OrderStatus;
  }>();
  statusModifyModalChange = output<boolean>();

  orderStatus = OrderStatus;

  closeModal = output<void>();

  showConfirmModal = signal<boolean>(false);
  showConfirmModifyModal = signal<boolean>(false);

  onStatusConfirmModifyModalChange() {
    this.showConfirmModifyModal.set(true);
  }

  cancelConfirmModifyModalChange() {
    this.showConfirmModifyModal.set(false);
  }

  onStatusChange() {
    this.showConfirmModal.set(true);
  }

  confirmStatusModifyModalChange(status: boolean) {
    this.showConfirmModifyModal.set(false);
    this.statusModifyModalChange.emit(status);
  }

  confirmStatusChange(status: OrderStatus) {
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
    return this.activeOrder()?.totalPrice!;
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
    const status = order.orderStatus;

    const STATUS: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.PENDING]: 'bg-status-pending',
      [OrderStatus.PREPARING]: 'bg-status-preparing',
      [OrderStatus.READY]: 'bg-status-ready',
      [OrderStatus.PAID]: 'bg-status-paid',
      [OrderStatus.COMPLETED]: 'bg-status-completed',
      [OrderStatus.CANCELLED]: 'bg-status-cancelled',
    };

    return STATUS[status];
  }

  getOrderStatusText(order: ContentOrder) {
    const status = order.orderStatus;

    const STATUS: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.PENDING]: 'Pendiente',
      [OrderStatus.PREPARING]: 'Preparando',
      [OrderStatus.READY]: 'Listo',
      [OrderStatus.PAID]: 'Pagado',
      [OrderStatus.COMPLETED]: 'Completado',
      [OrderStatus.CANCELLED]: 'Cancelado',
    };

    return STATUS[status];
  }
}
