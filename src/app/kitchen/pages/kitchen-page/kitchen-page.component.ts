import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderListComponent } from '../../components/order-list/kitchen-order-list.component';
import { OrderService } from 'src/app/orders/services/order.service';
import { Order } from 'src/app/orders/interfaces/order.interface';
import { KitchenOrder, KitchenProduct } from '../../interfaces/kitchen-order.interface';


@Component({
  selector: 'app-kitchen-page',
  standalone: true,
  imports: [CommonModule, OrderListComponent],
  templateUrl: './kitchen-page.component.html',
})
export class KitchenPageComponent {
  orderService = inject(OrderService);
  kitchenOrders: KitchenOrder[] = [];


  constructor() {
    this.loadOrders();
  }

  loadOrders() {
    this.orderService.fecthOrders().subscribe((orders) => {
      this.kitchenOrders = orders
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map(order => this.mapOrderToKitchenOrder(order));
    });
  }

  onChangeStatus({ order, status }: { order: KitchenOrder, status: 'EN_PREPARACION' | 'LISTO' }) {
    // Si necesitas actualizar el pedido en el backend, convierte KitchenOrder a Order aquí
    // O busca el Order original por ID y actualiza su estado
    // Ejemplo:
    // const originalOrder = ...;
    // originalOrder.estado = status;
    // this.orderService.updateOrder(originalOrder).subscribe(...);
    this.notifyWaiter(order);
    this.loadOrders();
  }

  mapOrderToKitchenOrder(order: Order): KitchenOrder {
    return {
      id: order.id,
      mesa: order.mesa,
      estado: order.estado as 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO',
      createdAt: order.createdAt,
      productos: order.productos.map(p => ({
        nombre: (p as any).name ?? '', // Ajusta según tu modelo
        cantidad: p.quantity ?? 0,
      })),
    };
  }
  

  notifyWaiter(order: KitchenOrder) {
    // Aquí puedes implementar la notificación real
    console.log(`Order ${order.id} is ready for delivery.`);
  }
}