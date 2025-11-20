import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable, map, catchError, throwError, tap, of } from 'rxjs';

import {
  ContentOrder,
  OrderStatus,
  RESTOrder,
} from '@src/app/orders/interfaces/order.interface';
import { ServedProductOrder } from '../components/order-card/order-card.component';

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

  private activeOrdersCache = new Map<string, RESTOrder>();
  private orderByIdCache = new Map<number, ContentOrder>();

  private readonly CACHE_TTL = 1 * 60 * 1000;
  private cacheTimestamps = new Map<string, number>();

  private isCacheValid(key: string): boolean {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;

    const now = Date.now();
    return now - timestamp < this.CACHE_TTL;
  }

  private setCache<T>(key: string, data: T): void {
    this.cacheTimestamps.set(key, Date.now());
  }

  clearCache(): void {
    this.activeOrdersCache.clear();
    this.orderByIdCache.clear();
    this.cacheTimestamps.clear();
  }

  clearOrderCache(orderId: number): void {
    this.orderByIdCache.delete(orderId);
  }

  fetchActiveOrders(
    options: Options,
    forceRefresh = false
  ): Observable<RESTOrder> {
    const {
      page = 1,
      limit = 6,
      status = kitchenStatus,
      sortField = 'createdAt',
      direction = Direction.DESC,
    } = options;

    const cacheKey = `active_orders_${page}_${limit}_${sortField}_${direction}_${status.join(
      '_'
    )}`;

    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      const cached = this.activeOrdersCache.get(cacheKey);
      if (cached) {
        return of(cached);
      }
    }

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
        tap((resp) => {
          this.activeOrdersCache.set(cacheKey, resp);
          this.setCache(cacheKey, resp);

          resp.content.forEach((order) => {
            this.orderByIdCache.set(order.id, order);
          });
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
    status: OrderStatus
  ): Observable<ContentOrder[]> {
    return this.http
      .patch<any>(`${this.envs.API_URL}/orders/status`, { status, orderId })
      .pipe(
        tap(() => {
          const cachedOrder = this.orderByIdCache.get(orderId);
          if (cachedOrder) {
            cachedOrder.orderStatus = status;
            this.orderByIdCache.set(orderId, cachedOrder);
          }

          this.clearCache();
        }),
        catchError((error) => {
          console.error('Error updating order status:', error);
          return throwError(
            () => new Error('Error al actualizar el estado de la orden')
          );
        })
      );
  }

  servedProductOrder(served: ServedProductOrder) {
    return this.http
      .patch(`${this.envs.API_URL}/orders/product-orders/serve`, served)
      .pipe(
        tap(() => {
          const cachedOrder = this.orderByIdCache.get(served.orderId);
          if (cachedOrder) {
            this.orderByIdCache.set(served.orderId, cachedOrder);
          }

          this.clearCache();
        }),
        catchError((error) => {
          console.error('Error updating served product order:', error);
          return throwError(
            () => new Error('Error al actualizar el producto servido')
          );
        })
      );
  }

  getCachedOrder(orderId: number): ContentOrder | undefined {
    return this.orderByIdCache.get(orderId);
  }

  preloadOrders(orders: ContentOrder[]): void {
    orders.forEach((order) => {
      this.orderByIdCache.set(order.id, order);
    });
    console.log(`💾 Preloaded ${orders.length} orders into cache`);
  }
}
