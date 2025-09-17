import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

import { OrderListComponent } from '../../components/order-list/kitchen-order-list.component';
import { OrderService } from 'src/app/orders/services/order.service';
import {
  Order,
  OrderStatus,
  ProductOrder,
  RestOrderStatus,
} from 'src/app/orders/interfaces/order.interface';
import type { KitchenOrder } from '../../interfaces/kitchen-order.interface';
import { map, tap } from 'rxjs';

@Component({
  selector: 'app-kitchen-page',
  imports: [CommonModule, OrderListComponent],
  templateUrl: './kitchen-page.component.html',
})
export class KitchenPageComponent {
  orderService = inject(OrderService);
  changeStatus = signal<RestOrderStatus.PREPARING | RestOrderStatus.READY>(
    RestOrderStatus.PREPARING
  );
  orderStatus = OrderStatus;

  orderKitcheStatus = [
    RestOrderStatus.PENDING,
    RestOrderStatus.PREPARING,
    RestOrderStatus.READY,
  ];

  orderResource = rxResource({
    params: () => ({ query: this.orderKitcheStatus }),
    stream: ({ params }) => {
      return this.orderService.fetchKitchenOrders(params.query).pipe(
        tap((orders) => {
          orders.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }),
        tap((orders) => console.log({ orders }))
      );
    },
  });

  mapOrderToKitchenOrder(order: Order): KitchenOrder {
    return {
      id: order.id,
      mesa: order.mesa,
      estado: order.estado as 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO',
      createdAt: order.createdAt,
      productos: order.productos.map((p) => ({
        nombre: (p as ProductOrder).name ?? '', // Ajusta según tu modelo
        cantidad: p.quantity ?? 0,
      })),
    };
  }

  notifyWaiter(order: KitchenOrder) {
    console.log(`Order ${order.id} is ready for delivery.`);
  }
}
