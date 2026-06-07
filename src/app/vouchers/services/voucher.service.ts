import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { RESTVoucher, VoucherResponse } from '../interfaces/voucher.interface';
import {
  CreateVoucherRequest,
  VoucherType,
} from '../interfaces/nubefact.interface';

interface Options {
  limit?: number;
  page?: number;
}

@Injectable({
  providedIn: 'root',
})
export class VoucherService {
  private http = inject(HttpClient);

  fetchVouchers(options: Options = {}) {
    const { limit = 10, page = 1 } = options;

    const params = {
      limit: limit.toString(),
      page: page.toString(),
    };

    return this.http
      .get<RESTVoucher>(`${environment.API_URL}/vouchers`, { params })
      .pipe(
        catchError((error) => {
          console.log({ error });
          return throwError(
            () => new Error('Error al cargar los comprobantes')
          );
        })
      );
  }

  createVoucher(voucherData: CreateVoucherRequest, type: VoucherType) {
    const endpoint = type === VoucherType.RECEIPT ? 'receipt' : 'invoice';

    return this.http
      .post<VoucherResponse>(
        `${environment.API_URL}/nubefact/${endpoint}`,
        voucherData
      )
      .pipe(
        catchError((error) => {
          console.error('Error al crear comprobante:', error);
          return throwError(
            () => new Error('Error al generar el comprobante electrónico')
          );
        })
      );
  }

  associatePayment(voucherId: number, paymentId: number) {
    return this.http
      .patch<VoucherResponse>(
        `${environment.API_URL}/vouchers/${voucherId}/payment/${paymentId}`,
        {}
      )
      .pipe(
        catchError((error) => {
          console.error('Error al asociar pago con comprobante:', error);
          return throwError(
            () => new Error('Error al asociar el pago con el comprobante')
          );
        })
      );
  }
}
