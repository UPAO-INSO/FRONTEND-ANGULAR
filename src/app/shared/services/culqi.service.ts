import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  CreateCulqiOrder,
  RESTCulqiOrder,
} from '../interfaces/culqi.interface';
import { environment } from '@src/environments/environment';
import { catchError, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CulqiService {
  private http = inject(HttpClient);

  private culqiOrdersCache = new Map<number, RESTCulqiOrder>();
  private cacheTimestamps = new Map<number, number>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000;

  createCulqiOrder(order: CreateCulqiOrder) {
    return this.http
      .post<RESTCulqiOrder>(
        `${environment.API_URL}/payments/culqi/createOrder`,
        order
      )
      .pipe(
        tap((culqiOrder) => {
          console.log('Culqi order created:', culqiOrder);
          const orderId = parseInt(culqiOrder.order_number);
          this.saveCulqiOrder(orderId, culqiOrder);
        }),
        catchError((error) => {
          console.error('Error creating Culqi order:', error);
          return throwError(() => new Error('Error creating Culqi order'));
        })
      );
  }

  saveCulqiOrder(orderId: number, culqiOrder: RESTCulqiOrder): void {
    this.culqiOrdersCache.set(orderId, culqiOrder);
    this.cacheTimestamps.set(orderId, Date.now());
  }

  getCulqiOrder(orderId: number): RESTCulqiOrder | null {
    const cachedOrder = this.culqiOrdersCache.get(orderId);
    if (!cachedOrder) {
      return null;
    }

    const timestamp = this.cacheTimestamps.get(orderId);
    if (timestamp && Date.now() - timestamp > this.CACHE_TTL) {
      console.log(`Orden Culqi expirada para orden #${orderId}`);
      this.removeCulqiOrder(orderId);
      return null;
    }

    console.log(`Orden Culqi encontrada en caché para orden #${orderId}`);
    return cachedOrder;
  }

  hasCulqiOrder(orderId: number): boolean {
    return this.getCulqiOrder(orderId) !== null;
  }

  removeCulqiOrder(orderId: number): void {
    this.culqiOrdersCache.delete(orderId);
    this.cacheTimestamps.delete(orderId);
    console.log(`Orden Culqi eliminada del caché para orden #${orderId}`);
  }

  clearCache(): void {
    this.culqiOrdersCache.clear();
    this.cacheTimestamps.clear();
    console.log('Caché de órdenes Culqi limpiado');
  }

  getAllCachedOrders(): Map<number, RESTCulqiOrder> {
    return new Map(this.culqiOrdersCache);
  }
}
