import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { OrderMapper } from '../mapper/order.mapper';
import {
  ContentOrder,
  Order,
  RESTOrder,
  RestOrderStatus,
} from '../interfaces/order.interface';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private http = inject(HttpClient);

  envs = environment;
  token = localStorage.getItem('access-token');

  private page = signal(0);

  activeOrdersByTable = signal<Map<number, Order>>(new Map());

  ordersByTableIds = signal<Order[]>([]);
  orders = signal<Order[]>([]);
  tableIds = signal<number[]>([]);
  filterOrders = signal<Order[]>([]);

  fecthOrders(): Observable<Order[]> {
    return this.http
      .get<RESTOrder>(`${this.envs.API_URL}/orders`, {
        params: {
          page: this.page(),
          limit: 10,
        },
      })
      .pipe(
        map(({ content }) => OrderMapper.mapRestOrdersToOrdersArray(content)),
        tap((orders) => {
          this.orders.set(orders);
          this.tableIds.set(orders.map((order) => order.mesa));
        }),
        catchError((error) => {
          console.log({ error });
          this.orders.set([]);
          return throwError(() => new Error('Error al cargar las órdenes'));
        })
      );
  }

  fetchKitchenOrders(status: RestOrderStatus[]): Observable<Order[]> {
    return this.http
      .post<RESTOrder>(
        `${this.envs.API_URL}/orders/filter-array-status`,
        [...status],
        {
          params: {
            page: this.page(),
            limit: 10,
          },
        }
      )
      .pipe(
        map(({ content }) => OrderMapper.mapRestOrdersToOrdersArray(content)),
        catchError((error) => {
          console.log({ error });

          return throwError(() => new Error('No se pudo obtener ordenes'));
        })
      );
  }

  fetchFilterOrder(status: string): Observable<Order[]> {
    status = status.toUpperCase();

    return this.http
      .get<ContentOrder[]>(`${this.envs.API_URL}/orders/filter-by`, {
        params: {
          status: status,
        },
      })
      .pipe(
        map((resp) => OrderMapper.mapRestOrdersToOrdersArray(resp)),
        tap((orders) => {
          this.filterOrders.set(orders);
          this.tableIds.set(orders.map((order) => order.mesa));
        }),
        catchError((error) => {
          console.log({ error });

          return throwError(
            () => new Error(`No se pudo obtener ordenes con ${status}`)
          );
        })
      );
  }

  fetchOrderByTableIds(tableIds: number[]) {
    return this.http
      .post<ContentOrder[]>(`${this.envs.API_URL}/orders/tables`, tableIds, {})
      .pipe(
        map((resp) => OrderMapper.mapRestOrdersToOrdersArray(resp)),
        tap((orders) => this.ordersByTableIds.set(orders)),
        catchError((error) => {
          console.log({ error });

          return throwError(
            () => new Error(`No se pudo obtener ordenes con ${tableIds}`)
          );
        })
      );
  }

  updateOrder(order: Order): Observable<Order> {
    return this.http
      .put<Order>(`${this.envs.API_URL}/orders/${order.id}`, order)
      .pipe(
        tap((updatedOrder) => {
          const orders = this.orders();
          const index = orders.findIndex((o) => o.id === updatedOrder.id);
          if (index !== -1) {
            orders[index] = updatedOrder;
            this.orders.set(orders);
          }
        }),
        catchError((error) => {
          console.log({ error });
          return throwError(
            () => new Error(`No se pudo actualizar la orden ${order.id}`)
          );
        })
      );
  }

  getOrderStatus(status: string): { class: string; text: string } {
    switch (status) {
      case 'PENDING':
        return { class: 'badge bg-amber-500', text: status };
      case 'PREPARING':
        return {
          class: 'badge bg-blue-600',
          text: status,
        };
      case 'PAID':
        return { class: 'badge bg-purple-700', text: status };
      case 'READY':
        return { class: 'badge bg-status-ready', text: status };
      case 'CANCELLED':
        return {
          class: 'badge bg-status-cancelled',
          text: status,
        };
      default:
        return { class: 'badge bg-gray-500', text: status };
    }
  }
}
