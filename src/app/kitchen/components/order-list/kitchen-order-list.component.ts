import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KitchenOrder } from '../../interfaces/kitchen-order.interface';
import { OrderCardComponent } from '../order-card/order-card.component';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, OrderCardComponent],
  templateUrl: './kitchen-order-list.component.html',
})
export class OrderListComponent {
  @Input() orders: KitchenOrder[] = [];
  @Output() changeStatus = new EventEmitter<{ order: KitchenOrder, status: 'EN_PREPARACION' | 'LISTO' }>();
}