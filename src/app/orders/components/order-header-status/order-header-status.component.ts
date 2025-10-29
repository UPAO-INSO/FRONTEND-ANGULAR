import { Component, output, signal } from '@angular/core';
import { OrderStatus } from '@src/app/orders/interfaces/order.interface';
import { SearchInputComponent } from '@src/app/tables/components/search-input/search-input.component';

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

  onSelectChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value;

    const status = value === 'all' ? null : (value as OrderStatus);
    this.selectStatus(status);
  }

  getSelectedFilterValue(): string {
    const selectedStatus = this.selectedStatus();
    return selectedStatus ?? 'all';
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
    {
      status: OrderStatus.READY,
      label: 'Listo',
      colorClass: 'text-status-ready',
    },
  ];
}
