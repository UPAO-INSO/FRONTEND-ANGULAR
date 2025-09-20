// src/app/kitchen/services/kitchen.service.ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable, map, tap, catchError, throwError } from 'rxjs';
import {
  KitchenOrder,
  KitchenOrderResponse,
  KitchenOrderStatus,
} from '../interfaces/kitchen-order.interface';
import { KitchenOrderMapper } from '../mapper/kitchen-order.mapper';

@Injectable({
  providedIn: 'root',
})
export class KitchenService {
  private http = inject(HttpClient);

  envs = environment;
  token = this.envs.API_TOKEN;

  fetchActiveOrders(): Observable<KitchenOrder[]> {
    return this.http
      .get<KitchenOrderResponse>(`${this.envs.API_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })
      .pipe(
        map((response) => {
          const allOrders = KitchenOrderMapper.mapRestOrdersToOrderArray(
            response.content || []
          );

          const activeOrders = allOrders.filter(
            (order) =>
              order.estado === KitchenOrderStatus.PENDING ||
              order.estado === KitchenOrderStatus.PREPARING ||
              order.estado === KitchenOrderStatus.READY
          );

          const sortedOrders = activeOrders.sort((a, b) => {
            if (
              a.estado === KitchenOrderStatus.READY &&
              b.estado !== KitchenOrderStatus.READY
            ) {
              return 1;
            }
            if (
              b.estado === KitchenOrderStatus.READY &&
              a.estado !== KitchenOrderStatus.READY
            ) {
              return -1;
            }

            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          });

          return sortedOrders;
        }),
        catchError((error) => {
          console.error('Error fetching kitchen orders:', error);
          return throwError(
            () => new Error('Error al cargar las órdenes de cocina')
          );
        })
      );
  }

  updateOrderStatus(
    orderId: number,
    status: KitchenOrderStatus
  ): Observable<KitchenOrder[]> {
    return this.http
      .patch<any>(
        `${this.envs.API_URL}/orders/status`,
        { status, orderId },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      )
      .pipe(
        catchError((error) => {
          console.error('Error updating order status:', error);
          return throwError(
            () => new Error('Error al actualizar el estado de la orden')
          );
        })
      );
  }
}
