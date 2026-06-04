import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@src/environments/environment';
import {
  ContentPayment,
  CreatePaymentRequest,
  PaymentType,
  RESTPayment,
} from '../interfaces/payments.inteface';
import { catchError, map, tap, throwError } from 'rxjs';

interface Options {
  limit?: number;
  page?: number;
  status?: string | null;
  paymentType?: PaymentType | null;
}

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private http = inject(HttpClient);

  private paymentsCache = new Map<string, RESTPayment>();
  private paymentByIdCache = new Map<number, ContentPayment>();

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
    this.paymentsCache.clear();
    this.paymentByIdCache.clear();
    this.cacheTimestamps.clear();
  }

  clearPaymentCache(paymentId: number): void {
    this.paymentByIdCache.delete(paymentId);
  }

  getPaymentCache(paymentId: number): ContentPayment | undefined {
    return this.paymentByIdCache.get(paymentId);
  }

  preloadPayments(payments: ContentPayment[]): void {
    payments.forEach((payment) => {
      this.paymentByIdCache.set(payment.id, payment);
    });
  }

  createPayment(payment: CreatePaymentRequest) {
    return this.http.post(`${environment.API_URL}/payments`, payment);
  }

  fetchPayments(options: Options) {
    const { limit = 10, page = 1, status, paymentType } = options;

    const params: any = {
      limit: limit,
      page: page,
    };

    if (status) {
      params.status = status;
    }

    if (paymentType) {
      params.paymentType = paymentType;
    }

    return this.http
      .get<RESTPayment>(`${environment.API_URL}/payments`, { params })
      .pipe(
        map((resp) => resp.content),
        catchError((error) => {
          console.log({ error });
          return throwError(() => new Error('Error al cargar las mesas'));
        })
      );
  }
}
