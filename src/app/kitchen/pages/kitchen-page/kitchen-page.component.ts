import { Component, inject, OnInit } from '@angular/core';
import { OrderStatus, Order } from 'src/app/orders/interfaces/order.interface';
import { OrderService } from 'src/app/orders/services/order.service';

@Component({
  selector: 'app-kitchen-page',
  templateUrl: './kitchen-page.component.html',
  styleUrls: ['./kitchen-page.component.css'],
})
export class KitchenPageComponent implements OnInit {
  orders: Order[] = [
    {
      id: 1,
      estado: 'PENDIENTE',
      total: 10,
      createdAt: new Date(),
      mesa: 1,
      productos: [],
    },
    {
      id: 2,
      estado: 'EN_PREPARACION',
      total: 10,
      createdAt: new Date(),
      mesa: 1,
      productos: [],
    },
    {
      id: 3,
      estado: 'PENDIENTE',
      total: 10,
      createdAt: new Date(),
      mesa: 1,
      productos: [],
    },
    {
      id: 4,
      estado: 'PENDIENTE',
      total: 10,
      createdAt: new Date(),
      mesa: 1,
      productos: [],
    },
    {
      id: 5,
      estado: 'TERMINADO',
      total: 10,
      createdAt: new Date(),
      mesa: 1,
      productos: [],
    },
  ];

  orderService = inject(OrderService);
  orderStatus = OrderStatus;

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.orderService.fecthOrders().subscribe((orders) => {
      this.orders = orders.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
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
