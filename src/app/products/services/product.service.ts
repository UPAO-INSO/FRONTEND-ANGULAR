import { HttpClient } from '@angular/common/http';
import { effect, inject, Injectable, OnInit, signal } from '@angular/core';
import { environment } from '@environments/environment';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';

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

  private productsCache = new Map<string, Product[]>();
  private productByIdCache = new Map<number, Product>();
  private productTypesCache = new Map<string, ProductType[]>();
  private productsByTypeCache = new Map<number, Product[]>();

  private readonly CACHE_TTL = 5 * 60 * 1000;
  private cacheTimestamps = new Map<string, number>();

  envs = environment;
  token = localStorage.getItem('access-token');
  userId = signal('');
  page = signal(1);
  totalPage = signal(1);
  private limit = signal(10);

  private refreshTrigger = signal(false);

  refreshTrigger$ = this.refreshTrigger.asReadonly();

  constructor() {
    this.initializeUserId();
    this.setupWebSocketConnection();
  }

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
    this.productsCache.clear();
    this.productByIdCache.clear();
    this.productTypesCache.clear();
    this.productsByTypeCache.clear();
    this.cacheTimestamps.clear();
  }

  clearProductsCache(): void {
    this.productsCache.clear();
    this.productByIdCache.clear();
  }

  private initializeUserId() {
    try {
      const userData = localStorage.getItem('user-data');
      if (userData) {
        const parsedUserData = JSON.parse(userData);

        const firstKey = Object.keys(parsedUserData)[0];
        const userId = parsedUserData[firstKey];

        this.userId.set(userId?.toString() || '');

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
          this.clearProductsCache();
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
    this.refreshTrigger.set(true);
  }

  updateProduct(partialProduct: PartialProductUpdate) {
    const { id, available } = partialProduct;

    return this.http
      .patch(`${this.envs.API_URL}/products/partial/${id}`, {
        available,
      })
      .pipe(
        tap(() => {
          const cachedProduct = this.productByIdCache.get(id);
          if (cachedProduct) {
            cachedProduct.available = available;
            this.productByIdCache.set(id, cachedProduct);
          }

          this.sendProductUpdate(id, available);
          this.triggerRefresh();
        }),
        catchError((error) => {
          console.log({ error });

          return throwError(() => 'No se pudo actualizar el producto');
        })
      );
  }

  fetchProducts(forceRefresh = false): Observable<Product[]> {
    const cacheKey = `products_${this.page()}_${this.limit()}`;

    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      const cached = this.productsCache.get(cacheKey);
      if (cached) {
        return of(cached);
      }
    }

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
        ),
        tap((products) => {
          this.productsCache.set(cacheKey, products);
          this.setCache(cacheKey, products);

          products.forEach((product) => {
            this.productByIdCache.set(product.id, product);
          });
        }),
        catchError((error) => {
          console.log({ error });

          return throwError(() => Error('No se pudo obtener los productos'));
        })
      );
  }

  fetchProductsByIds(
    ids: number[],
    forceRefresh = false
  ): Observable<Product[]> {
    // const cacheKey = `products_ids_${ids.sort().join('_')}`;

    if (!forceRefresh) {
      const cachedProducts: Product[] = [];
      const missingIds: number[] = [];

      ids.forEach((id) => {
        const cached = this.productByIdCache.get(id);
        if (cached) {
          cachedProducts.push(cached);
        } else {
          missingIds.push(id);
        }
      });

      if (missingIds.length === 0) {
        return of(cachedProducts);
      }

      if (cachedProducts.length > 0 && missingIds.length < ids.length) {
        return this.http
          .post<Product[]>(
            `${this.envs.API_URL}/products/find-by-ids`,
            missingIds
          )
          .pipe(
            tap((newProducts) => {
              newProducts.forEach((product) => {
                this.productByIdCache.set(product.id, product);
              });
            }),
            map((newProducts) => [...cachedProducts, ...newProducts])
          );
      }
    }

    return this.http
      .post<Product[]>(`${this.envs.API_URL}/products/find-by-ids`, ids)
      .pipe(
        tap((products) => {
          products.forEach((product) => {
            this.productByIdCache.set(product.id, product);
          });
          console.log(`💾 Cached ${products.length} products`);
        }),
        catchError((error) => {
          console.log({ error });

          return throwError(() => Error('No se pudo obtener los productos'));
        })
      );
  }

  fetchProductsByNameContainig(name: string): Observable<Product[]> {
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

  fetchProductsType(forceRefresh = false): Observable<ProductType[]> {
    const cacheKey = `product_types_${this.page()}_${this.limit()}`;

    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      const cached = this.productTypesCache.get(cacheKey);
      if (cached) {
        return of(cached);
      }
    }

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
        ),
        tap((types) => {
          this.productTypesCache.set(cacheKey, types);
          this.setCache(cacheKey, types);
        })
      );
  }

  fetchProductsByTypeId(
    productTypeId: number,
    forceRefresh = false
  ): Observable<Product[]> {
    if (!forceRefresh) {
      const cached = this.productsByTypeCache.get(productTypeId);
      if (cached && this.isCacheValid(`type_${productTypeId}`)) {
        return of(cached);
      }
    }

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
        ),
        tap((products) => {
          this.productsByTypeCache.set(productTypeId, products);
          this.setCache(`type_${productTypeId}`, products);

          products.forEach((product) => {
            this.productByIdCache.set(product.id, product);
          });
        })
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
