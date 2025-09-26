import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';

import type { KitchenOrderStatus } from '../../interfaces/kitchen-order.interface';
import { KitchenService } from '../../services/kitchen.service';
import { KitchenOrderListComponent } from '../../components/order-list/kitchen-order-list.component';

@Component({
  selector: 'app-kitchen-page',
  imports: [KitchenOrderListComponent],
  templateUrl: './kitchen-page.component.html',
})
export default class KitchenPageComponent implements OnInit, OnDestroy {
  private kitchenService = inject(KitchenService);
  private refreshInterval?: number;

  // Usa rxResource para manejar la carga automática
  ordersResource = rxResource({
    stream: () => this.kitchenService.fetchActiveOrders(),
  });

  // Computed desde el resource
  orders = this.ordersResource.value;
  isLoading = this.ordersResource.isLoading;
  error = this.ordersResource.error;

  ngOnInit() {
    this.setupAutoRefresh();
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  onStatusChange(orderId: number, newStatus: KitchenOrderStatus) {
    this.kitchenService.updateOrderStatus(orderId, newStatus).subscribe({
      next: () => {
        console.log(`Order ${orderId} status updated to ${newStatus}`);
        // Recargar las órdenes después de actualizar
        this.ordersResource.reload();
      },
      error: (error) => {
        console.error('Error updating order status:', error);
      },
    });
  }

  onRefresh() {
    this.ordersResource.reload();
  }

  private setupAutoRefresh() {
    this.refreshInterval = window.setInterval(() => {
      if (!this.isLoading()) {
        this.ordersResource.reload();
      }
    }, 30000);
  }
}
