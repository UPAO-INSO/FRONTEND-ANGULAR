import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable, map, catchError, throwError } from 'rxjs';
import {
  KitchenOrder,
  KitchenOrderStatus,
} from '../interfaces/kitchen-order.interface';
import {
  OrderStatus,
  RESTOrder,
} from '@src/app/orders/interfaces/order.interface';

interface Options {
  limit?: number;
  page?: number;
  status?: OrderStatus[];
}

const kitchenStatus = [
  KitchenOrderStatus.PENDING,
  KitchenOrderStatus.PREPARING,
  KitchenOrderStatus.READY,
];

@Injectable({
  providedIn: 'root',
})
export class KitchenService {
  private http = inject(HttpClient);

  envs = environment;

  fetchActiveOrders(options: Options): Observable<RESTOrder> {
    const { page = 1, limit = 6, status = kitchenStatus } = options;

    return this.http
      .post<RESTOrder>(
        `${this.envs.API_URL}/orders/filter-array-status`,
        [...status],
        {
          params: {
            page,
            limit,
          },
        }
      )
      .pipe(
        map((response) => {
          const sortedOrders = response.content.sort((a, b) => {
            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          });

          return {
            ...response,
            content: sortedOrders,
          };
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
      .patch<any>(`${this.envs.API_URL}/orders/status`, { status, orderId })
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
