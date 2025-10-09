import { HttpClient } from '@angular/common/http';
import { effect, inject, Injectable, OnInit, signal } from '@angular/core';
import { environment } from '@environments/environment';
import { catchError, map, Observable, tap, throwError } from 'rxjs';

import {
  PartialProductUpdate,
  Product,
  ProductType,
  RESTProduct,
  RESTProductType,
} from '../interfaces/product.type';
import { ProductMapper, ProductTypeMapper } from '../mapper/product-mapper';
import { WebSocketService } from '@shared/services/websocket.service';
import { WebSocketMessage } from '@shared/interfaces/websocket-message.interface';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);
  private wsService = inject(WebSocketService);

  envs = environment;
  token = localStorage.getItem('access-token');
  userId = signal('');

  page = signal(1);
  totalPage = signal(1);
  private limit = signal(10);

  private refreshTrigger = signal(0);

  refreshTrigger$ = this.refreshTrigger.asReadonly();

  constructor() {
    this.initializeUserId();

    this.setupWebSocketConnection();
  }

  private initializeUserId() {
    try {
      const userData = localStorage.getItem('user-data');
      if (userData) {
        const parsedUserData = JSON.parse(userData);

        const firstKey = Object.keys(parsedUserData)[0];
        const userId = parsedUserData[firstKey];

        this.userId.set(userId?.toString() || '');

        console.log('User ID extracted from localStorage:', this.userId());
        console.log('Full user data:', parsedUserData);
      } else {
        console.warn('No user-data found in localStorage');
        this.userId.set('anonymous');
      }
    } catch (error) {
      console.error('Error parsing user-data from localStorage:', error);
      this.userId.set('error');
    }
  }

  private setupWebSocketConnection() {
    effect(() => {
      const currentUserId = this.userId();
      if (currentUserId && currentUserId !== '') {
        console.log('Joining WebSocket room with userId:', currentUserId);
        this.wsService.joinRoom('pds-room');

        this.setupProductUpdateListener();
      }
    });
  }

  private setupProductUpdateListener() {
    this.wsService.productUpdates$.subscribe((update) => {
      if (update && update.type === 'PRODUCT_UPDATE') {
        console.log('Product update received from another device:', update);

        if (update.updatedBy !== this.userId()) {
          console.log('Triggering refresh for external product update');
          this.triggerRefresh();
        }
      }
    });
  }

  sendMessage() {
    const message: WebSocketMessage = {
      content: 'WEBSOCKET-MESSAGE',
      sender: this.userId(),
    };
    this.wsService.sendMessage('pds-room', message);
  }

  sendProductUpdate(productId: number, available: boolean) {
    const success = this.wsService.sendProductUpdate(
      productId,
      available,
      this.userId()
    );
    if (success) {
      console.log('Product update sent successfully via WebSocket');
    } else {
      console.warn('Failed to send product update via WebSocket');
    }
    return success;
  }

  triggerRefresh() {
    this.refreshTrigger.set(this.refreshTrigger() + 1);
  }

  updateProduct(partialProduct: PartialProductUpdate) {
    const { id, available } = partialProduct;

    return this.http
      .patch(`${this.envs.API_URL}/products/partial/${id}`, {
        available,
      })
      .pipe(
        tap(() => {
          this.sendProductUpdate(id, available);
          this.triggerRefresh();
        }),
        catchError((error) => {
          console.log({ error });

          return throwError(() => 'No se pudo actualizar ordenes');
        })
      );
  }

  fetchProducts(): Observable<Product[]> {
    return this.http
      .get<RESTProduct>(`${this.envs.API_URL}/products`, {
        params: {
          page: this.page(),
          limit: this.limit(),
        },
      })
      .pipe(
        map(({ content }) =>
          ProductMapper.mapRestProductsToProductArray(content)
        )
      );
  }

  fetchProductsByNameContainig(name: string): Observable<Product[]> {
    console.log(name);

    return this.http
      .get<Product[]>(`${this.envs.API_URL}/products/name-contains/${name}`, {
        params: {
          page: this.page(),
          limit: this.limit(),
        },
      })
      .pipe(
        tap((resp) => console.log({ resp })),
        catchError((error) => {
          console.log({ error });

          return throwError(() => 'No se encontró producto');
        })
      );
  }

  fetchProductsType(): Observable<ProductType[]> {
    return this.http
      .get<RESTProductType>(`${this.envs.API_URL}/products-types`, {
        params: {
          page: this.page(),
          limit: this.limit(),
        },
      })
      .pipe(
        map(({ content }) =>
          ProductTypeMapper.mapRestProductsTypeToProductTypeArray(content)
        )
      );
  }

  fetchProductsByTypeId(productTypeId: number): Observable<Product[]> {
    return this.http
      .get<RESTProduct>(
        `${this.envs.API_URL}/products/by-product-type/${productTypeId}`,
        {
          params: {
            page: this.page(),
            limit: this.limit(),
          },
        }
      )
      .pipe(
        map(({ content }) =>
          ProductMapper.mapRestProductsToProductArray(content)
        )
      );
  }

  getCurrentUserId(): string {
    return this.userId();
  }

  refreshUserId() {
    this.initializeUserId();
  }

  getUserData() {
    try {
      const userData = localStorage.getItem('user-data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }
}
