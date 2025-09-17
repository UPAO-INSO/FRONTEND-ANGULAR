import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KitchenOrder } from 'src/app/kitchen/interfaces/kitchen-order.interface';

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-card.component.html',
})
export class OrderCardComponent {
  @Input() order!: KitchenOrder;
  @Output() changeStatus = new EventEmitter<'EN_PREPARACION' | 'LISTO'>();

  get statusLabel() {
    switch (this.order.estado) {
      case 'PENDIENTE': return 'Pending';
      case 'EN_PREPARACION': return 'In Preparation';
      case 'LISTO': return 'Finished';
      default: return '';
    }
  }

  get statusColor() {
    switch (this.order.estado) {
      case 'PENDIENTE': return 'badge-warning';
      case 'EN_PREPARACION': return 'badge-info';
      case 'LISTO': return 'badge-success';
      default: return '';
    }
  }
}