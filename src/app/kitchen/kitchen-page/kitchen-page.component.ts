import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../orders/services/order.service';
import { Order, OrderStatus } from '../../orders/interfaces/order.interface';

@Component({
  selector: 'app-kitchen-page',
  templateUrl: './kitchen-page.component.html',
  styleUrls: ['./kitchen-page.component.css'],
})
export class KitchenPageComponent implements OnInit {
  orders: Order[] = [];

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.orderService.fecthOrders().subscribe((orders) => {
      this.orders = orders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });
  }

  startPreparation(order: Order): void {
    order.estado = OrderStatus.EN_PREPARACION;
    this.orderService.updateOrder(order).subscribe();
  }

  markAsFinished(order: Order): void {
    order.estado = OrderStatus.LISTO;
    this.orderService.updateOrder(order).subscribe(() => {
      this.notifyWaiter(order);
    });
  }

  notifyWaiter(order: Order): void {
    console.log(`Order ${order.id} is ready for delivery.`);
  }
}