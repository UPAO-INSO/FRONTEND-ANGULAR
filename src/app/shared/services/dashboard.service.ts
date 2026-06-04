import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

import { environment } from '@environments/environment';
import { ContentOrder, OrderStatus, RESTOrder } from '@src/app/orders/interfaces/order.interface';
import { RESTTable, TableStatus } from '@src/app/tables/interfaces/table.interface';
import { ContentPayment, RESTPayment } from '@src/app/payments/interfaces/payments.inteface';

export interface DashboardStats {
  activeOrders:      ContentOrder[];
  recentOrders:      ContentOrder[];
  tables:            RESTTable;
  todayPayments:     ContentPayment[];
  ordersByStatus:    Record<OrderStatus, number>;
  todayRevenue:      number;
  occupiedTables:    number;
  totalTables:       number;
  completedToday:    number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private api  = environment.API_URL;

  /** Carga todos los datos del dashboard en una sola llamada paralela. */
  loadAll(): Observable<DashboardStats> {
    return forkJoin({
      activeOrders:  this.fetchActiveOrders(),
      recentOrders:  this.fetchRecentOrders(),
      tables:        this.fetchTables(),
      todayPayments: this.fetchTodayPayments(),
    }).pipe(
      map(({ activeOrders, recentOrders, tables, todayPayments }) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const completedToday = recentOrders.filter(o => {
          const created = new Date(o.createdAt);
          return (
            o.orderStatus === OrderStatus.COMPLETED &&
            created >= today
          );
        }).length;

        const todayRevenue = todayPayments
          .filter(p => {
            const paid = p.paidAt ? new Date(p.paidAt) : null;
            return paid && paid >= today;
          })
          .reduce((sum, p) => sum + (p.amount / 100), 0); // amount viene en centavos para Culqi

        const occupiedTables = tables.content.filter(
          t => t.status === TableStatus.OCCUPIED
        ).length;

        const ordersByStatus = recentOrders.reduce((acc, o) => {
          acc[o.orderStatus] = (acc[o.orderStatus] ?? 0) + 1;
          return acc;
        }, {} as Record<OrderStatus, number>);

        // Asegurar que todos los estados estén presentes
        for (const s of Object.values(OrderStatus)) {
          if (!(s in ordersByStatus)) ordersByStatus[s] = 0;
        }

        return {
          activeOrders,
          recentOrders,
          tables,
          todayPayments,
          ordersByStatus,
          todayRevenue,
          occupiedTables,
          totalTables: tables.totalElements,
          completedToday,
        } satisfies DashboardStats;
      })
    );
  }

  /** Pedidos activos: PENDING + PREPARING + READY */
  private fetchActiveOrders(): Observable<ContentOrder[]> {
    const statuses = [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY];
    return this.http
      .post<RESTOrder>(
        `${this.api}/orders/filter-array-status`,
        statuses,
        { params: { page: 1, limit: 50, direction: 'ASC', sortField: 'createdAt' } }
      )
      .pipe(
        map(r => r.content ?? []),
        catchError(() => of([]))
      );
  }

  /** Últimas 10 órdenes (cualquier estado) para el feed de actividad */
  private fetchRecentOrders(): Observable<ContentOrder[]> {
    return this.http
      .get<RESTOrder>(`${this.api}/orders`, {
        params: { page: 1, limit: 10, direction: 'DESC', sortField: 'createdAt' },
      })
      .pipe(
        map(r => r.content ?? []),
        catchError(() => of([]))
      );
  }

  /** Todas las mesas */
  private fetchTables(): Observable<RESTTable> {
    return this.http
      .get<RESTTable>(`${this.api}/tables`, { params: { page: 1, limit: 50 } })
      .pipe(catchError(() => of({ content: [], totalPages: 0, totalElements: 0, size: 0, page: 1, empty: true })));
  }

  /** Últimos 100 pagos para calcular ingresos del día */
  private fetchTodayPayments(): Observable<ContentPayment[]> {
    return this.http
      .get<RESTPayment>(`${this.api}/payments`, { params: { page: 1, limit: 100 } })
      .pipe(
        map(r => r.content ?? []),
        catchError(() => of([]))
      );
  }
}
