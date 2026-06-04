import { Component, computed, input } from '@angular/core';
import { OrderStatus } from '@src/app/orders/interfaces/order.interface';
import {
  ORDER_STATUS_BADGE_CLASS,
  ORDER_STATUS_LABELS,
} from '@src/app/shared/utils/order-status.utils';

@Component({
  selector: 'app-status-badge',
  template: `
    <span class="badge text-xs font-bold {{ badgeClass() }}">
      {{ label() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  status = input.required<OrderStatus>();

  label     = computed(() => ORDER_STATUS_LABELS[this.status()]);
  badgeClass = computed(() => ORDER_STATUS_BADGE_CLASS[this.status()]);
}
