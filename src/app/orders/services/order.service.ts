import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import {
  ContentOrder,
  OrderStatus,
  PersonByFullName,
  PersonResponse,
  RequestOrder,
  RESTOrder,
} from '../interfaces/order.interface';
import { environment } from '@environments/environment';

const atmStatus = [
  OrderStatus.PENDING,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.PAID,
];

enum Direction {
  ASC = 'ASC',
  DESC = 'DESC',
}

interface Options {
  limit?: number;
  page?: number;
  sortField?: string;
  direction?: Direction;
  status?: OrderStatus | OrderStatus[];
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private http = inject(HttpClient);

  envs = environment;

  private ordersCache = new Map<string, RESTOrder>();
  private orderByIdCache = new Map<number, ContentOrder>();
  private personCache = new Map<string, PersonResponse>();
  private ordersByTableCache = new Map<number, ContentOrder[]>();

  private readonly CACHE_TTL = 2 * 60 * 1000;
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
    this.ordersCache.clear();
    this.orderByIdCache.clear();
    this.ordersByTableCache.clear();
    this.cacheTimestamps.clear();
  }

  clearTableCache(tableId: number): void {
    this.ordersByTableCache.delete(tableId);
  }

  createOrder(order: RequestOrder): Observable<ContentOrder> {
    return this.http
      .post<ContentOrder>(`${this.envs.API_URL}/orders/create`, {
        ...order,
      })
      .pipe(
        tap((newOrder) => {
          this.orderByIdCache.set(newOrder.id, newOrder);
          this.clearTableCache(order.tableId);
          this.clearCache();
        }),
        catchError((error) => {
          console.error('OrderService error:', error);
          return throwError(() => 'No se pudo crear ordenes');
        })
      );
  }

  searchPersonByFullName(person: PersonByFullName): Observable<PersonResponse> {
    const cacheKey = `${person.name}_${person.lastname}`.toLowerCase();

    if (this.isCacheValid(cacheKey)) {
      const cached = this.personCache.get(cacheKey);
      if (cached) {
        console.log('📦 Returning cached person');
        return of(cached);
      }
    }

    return this.http
      .post<PersonResponse>(`${this.envs.API_URL}/persons/by-full-name`, person)
      .pipe(
        tap((personResponse) => {
          this.personCache.set(cacheKey, personResponse);
          this.setCache(cacheKey, personResponse);
          console.log('💾 Person cached');
        }),
        catchError((error) => {
          console.log({ error });

          return throwError(() => new Error('Error al obtener persona'));
        })
      );
  }

  searchByTableNumber(options: Options, number: number, forceRefresh = false) {
    const { limit = 8, page = 1, status = '' } = options;
    const cacheKey = `table_${number}_${page}_${limit}_${status}`;

    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      const cached = this.ordersCache.get(cacheKey);
      if (cached) {
        return of(cached);
      }
    }

    return this.http
      .get<RESTOrder>(`${this.envs.API_URL}/orders/by-tableId/${number}`, {
        params: {
          page,
          limit,
        },
      })
      .pipe(
        tap((orders) => {
          this.ordersCache.set(cacheKey, orders);
          this.setCache(cacheKey, orders);
        }),
        catchError((error) => {
          console.log({ error });

          return throwError(() => new Error('Error al cargar las mesas'));
        })
      );
  }

  fetchOrderByTablesIds(
    tableIds: number[],
    options: Options,
    forceRefresh = false
  ): Observable<ContentOrder[]> {
    const { page = 1, limit = 8 } = options;
    const cacheKey = `tables_${tableIds.sort().join('_')}_${page}_${limit}`;

    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      const cached = this.ordersByTableCache.get(tableIds[0]);
      if (cached) {
        return of(cached);
      }
    }

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
        tap((orders) => {
          tableIds.forEach((tableId) => {
            this.ordersByTableCache.set(tableId, orders);
          });
          this.setCache(cacheKey, orders);
        }),
        catchError((error) => {
          console.error({ error });

          return throwError(
            () => new Error('No se pudo obtener órdenes activas')
          );
        })
      );
  }

  fecthOrders(options: Options, forceRefresh = false): Observable<RESTOrder> {
    const { page = 1, limit = 5, status = '' } = options;
    const cacheKey = `orders_${page}_${limit}_${status}`;

    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      const cached = this.ordersCache.get(cacheKey);
      if (cached) {
        return of(cached);
      }
    }

    return this.http
      .get<RESTOrder>(`${this.envs.API_URL}/orders`, {
        params: {
          page,
          limit,
          status,
        },
      })
      .pipe(
        tap((orders) => {
          this.ordersCache.set(cacheKey, orders);
          this.setCache(cacheKey, orders);
        }),
        catchError((error) => {
          console.log({ error });

          return throwError(() => new Error('Error al cargar las órdenes'));
        })
      );
  }

  fetchAtmOrders(
    options: Options,
    forceRefresh = false
  ): Observable<RESTOrder> {
    const { page = 1, limit = 5 } = options;
    const cacheKey = `atm_orders_${page}_${limit}`;

    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      const cached = this.ordersCache.get(cacheKey);
      if (cached) {
        return of(cached);
      }
    }

    return this.http
      .post<RESTOrder>(
        `${this.envs.API_URL}/orders/filter-array-status`,
        [...atmStatus],
        {
          params: {
            page,
            limit,
          },
        }
      )
      .pipe(
        tap((orders) => {
          this.ordersCache.set(cacheKey, orders);
          this.setCache(cacheKey, orders);
        }),
        catchError((error) => {
          console.log({ error });

          return throwError(() => new Error('No se pudo obtener ordenes'));
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

  updateOrder(id: number, order: ContentOrder): Observable<ContentOrder> {
    return this.http
      .put<ContentOrder>(`${this.envs.API_URL}/orders/${id}`, order)
      .pipe(
        tap((updatedOrder) => {
          this.orderByIdCache.set(id, updatedOrder);
          this.clearTableCache(order.tableId);
          this.clearCache();
        }),
        catchError((error) => {
          console.error({ error });

          return throwError(() => new Error('Error al actualizar la orden'));
        })
      );
  }
}
