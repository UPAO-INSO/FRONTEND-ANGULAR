import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import {
  ContentOrder,
  OrderStatus,
  RequestOrder,
  RESTOrder,
} from '../interfaces/order.interface';
import { environment } from '@environments/environment';
import { KitchenOrderStatus } from '@kitchen/interfaces/kitchen-order.interface';

interface Options {
  limit?: number;
  page?: number;
  status?: OrderStatus | OrderStatus[];
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private http = inject(HttpClient);

  envs = environment;

  createOrder(order: RequestOrder): Observable<ContentOrder> {
    return this.http
      .post<ContentOrder>(`${this.envs.API_URL}/orders/create`, {
        ...order,
      })
      .pipe(
        catchError((error) => {
          console.error('OrderService error:', error);
          return throwError(() => 'No se pudo crear ordenes');
        })
      );
  }

  searchByTableNumber(options: Options, number: number) {
    const { limit = 8, page = 1, status = '' } = options;

    console.log({ number });

    return this.http
      .get<RESTOrder>(`${this.envs.API_URL}/orders/by-tableId/${number}`, {
        params: {
          page,
          limit,
        },
      })
      .pipe(
        tap((resp) => console.log({ resp })),
        catchError((error) => {
          console.log({ error });

          return throwError(() => new Error('Error al cargar las mesas'));
        })
      );
  }

  fetchOrderByTablesIds(
    tableIds: number[],
    options: Options
  ): Observable<ContentOrder[]> {
    const { page = 1, limit = 8 } = options;

    return this.http
      .post<RESTOrder>(
        `${this.envs.API_URL}/orders/filter-by-tables-and-status`,
        {
          tableIds,
          orderStatus: [
            OrderStatus.PENDING,
            OrderStatus.PREPARING,
            OrderStatus.READY,
          ],
        },
        {
          params: {
            page,
            limit,
          },
        }
      )
      .pipe(
        map((response) => {
          return response.content || [];
        }),
        catchError((error) => {
          console.error({ error });

          return throwError(
            () => new Error('No se pudo obtener órdenes activas')
          );
        })
      );
  }

  fecthOrders(options: Options): Observable<RESTOrder> {
    const { page = 1, limit = 5, status = '' } = options;

    return this.http
      .get<RESTOrder>(`${this.envs.API_URL}/orders`, {
        params: {
          page,
          limit,
          status,
        },
      })
      .pipe(
        tap(),
        catchError((error) => {
          console.log({ error });

          return throwError(() => new Error('Error al cargar las órdenes'));
        })
      );
  }

  fetchKitchenOrders(options: Options): Observable<RESTOrder> {
    const { page = 1, limit = 11, status = [] } = options;

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
        catchError((error) => {
          console.log({ error });

          return throwError(() => new Error('No se pudo obtener ordenes'));
        })
      );
  }

  updateOrderStatus(
    orderId: number,
    status: OrderStatus | KitchenOrderStatus
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
