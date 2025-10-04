import { Component, computed, input } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { ContentOrder, OrderStatus } from '../../interfaces/order.interface';
import { OrderListItemComponent } from './order-list-item/order-list-item.component';

@Component({
  selector: 'app-order-list',
  imports: [OrderListItemComponent],
  templateUrl: './order-list.component.html',
})
export class OrderListComponent {
  orders = input.required<ContentOrder[]>({});

  isEmpty = input<boolean>(false);
  isLoading = input<boolean>(false);
  errorMessage = input<string | unknown | null>();

  displayState = computed(() => {
    if (this.isLoading()) return 'loading';
    if (this.errorMessage()) return 'error';
    if (this.orders().length > 0) return 'success';
    return 'empty';
  });
}
