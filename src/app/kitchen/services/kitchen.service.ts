import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable, map, catchError, throwError, tap } from 'rxjs';

import {
  ContentOrder,
  OrderStatus,
  RESTOrder,
} from '@src/app/orders/interfaces/order.interface';

enum Direction {
  ASC = 'ASC',
  DESC = 'DESC',
}

interface Options {
  limit?: number;
  page?: number;
  sortField?: string;
  direction?: Direction;
  status?: OrderStatus[];
}

const kitchenStatus = [
  OrderStatus.PENDING,
  OrderStatus.PREPARING,
  OrderStatus.READY,
];

@Injectable({
  providedIn: 'root',
})
export class KitchenService {
  private http = inject(HttpClient);

  envs = environment;

  fetchActiveOrders(options: Options): Observable<RESTOrder> {
    const {
      page = 1,
      limit = 6,
      status = kitchenStatus,
      sortField = 'createdAt',
      direction = Direction.DESC,
    } = options;

    return this.http
      .post<RESTOrder>(
        `${this.envs.API_URL}/orders/filter-array-status`,
        [...status],
        {
          params: {
            page,
            limit,
            sortField,
            direction,
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
        tap((resp) => console.log({ resp })),
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
    status: OrderStatus
  ): Observable<ContentOrder[]> {
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
