import { Component, effect, output, signal } from '@angular/core';
import { OrderStatus } from 'src/app/orders/interfaces/order.interface';
import { SearchInputComponent } from 'src/app/tables/components/search-input/search-input.component';

interface StatusFilter {
  status: OrderStatus | null;
  label: string;
  colorClass: string;
  icon?: string;
}

@Component({
  selector: 'app-order-header-status',
  imports: [SearchInputComponent],
  templateUrl: './order-header-status.component.html',
})
export class OrderStatusComponent {
  status = output<OrderStatus | null>();
  value = output<number>();

  orderStatus = OrderStatus;

  selectedStatus = signal<OrderStatus | null>(null);
  inputValue = signal<number | null>(null);

  tableNumberValue(number: number) {
    this.value.emit(number);
  }

  selectStatus(newStatus: OrderStatus | null) {
    this.selectedStatus.set(newStatus);
    this.status.emit(newStatus);
  }

  isStatusSelected(status: OrderStatus): boolean {
    return this.selectedStatus() === status;
  }

  statusFilters: StatusFilter[] = [
    {
      status: null,
      label: 'Todos',
      colorClass: 'text-white',
      icon: 'fa-solid fa-list',
    },
    {
      status: OrderStatus.PREPARING,
      label: 'Preparando',
      colorClass: 'text-status-preparing',
    },
    {
      status: OrderStatus.PENDING,
      label: 'Pendiente',
      colorClass: 'text-status-pending',
    },
    {
      status: OrderStatus.PAID,
      label: 'Pagado',
      colorClass: 'text-status-paid',
    },
    // {
    //   status: OrderStatus.CANCELLED,
    //   label: 'Cancelado',
    //   colorClass: 'text-status-cancelled',
    // },
    {
      status: OrderStatus.READY,
      label: 'Listo',
      colorClass: 'text-status-ready',
    },
  ];
}
