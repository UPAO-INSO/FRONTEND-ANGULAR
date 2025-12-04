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
  RestProductContent,
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
    // this.setupWebSocketConnection();
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

  /**
   * Actualización parcial (disponibilidad)
   * Backend espera ProductResponseDto pero solo procesa campos no-null
   * El partialUpdate verifica cada campo con != null
   */
  updateProduct(partialProduct: PartialProductUpdate) {
    const { id, available } = partialProduct;

    // Solo enviamos el campo que queremos actualizar
    // El backend verifica: if (product.getAvailable() != null) { updateAvailableById(...) }
    const partialDto = {
      available: available,
    };

    return this.http
      .patch(`${this.envs.API_URL}/products/partial/${id}`, partialDto)
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

  /**
   * Crear un nuevo producto
   */
  createProduct(request: {
    name: string;
    price: number;
    description: string;
    productTypeId: number;
    recipe?: {
      inventoryId: number;
      quantity: number;
      unitOfMeasure: string;
    }[];
    initialQuantity?: number; // Para bebidas y descartables
  }): Observable<Product> {
    return this.http
      .post<RestProductContent>(`${this.envs.API_URL}/products`, request)
      .pipe(
        map((response) => ProductMapper.mapRestProductToProduct(response)),
        tap(() => this.clearProductsCache()),
        catchError((error) => {
          console.error('Error creating product:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener producto por ID
   */
  fetchProductById(id: number, forceRefresh = false): Observable<Product> {
    if (!forceRefresh) {
      const cached = this.productByIdCache.get(id);
      if (cached) {
        return of(cached);
      }
    }

    return this.http
      .get<RestProductContent>(`${this.envs.API_URL}/products/${id}`)
      .pipe(
        map((response) => ProductMapper.mapRestProductToProduct(response)),
        tap((product) => this.productByIdCache.set(id, product)),
        catchError((error) => {
          console.error('Error fetching product:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Actualizar producto completo
   * Backend espera ProductRequestDto con: name, description, price, productTypeId (requeridos)
   * y active, available (opcionales)
   */
  updateProductFull(
    id: number,
    request: {
      name: string;
      price: number;
      description: string;
      productTypeId: number;
      active?: boolean;
      available?: boolean;
      recipe?: {
        inventoryId: number;
        quantity: number;
        unitOfMeasure: string;
      }[];
    }
  ): Observable<Product> {
    // Asegurar que enviamos el DTO correcto para el backend
    const dto = {
      name: request.name,
      description: request.description,
      price: request.price,
      productTypeId: request.productTypeId,
      active: request.active ?? true,
      available: request.available ?? true,
      recipe: request.recipe,
    };

    return this.http
      .put<RestProductContent>(`${this.envs.API_URL}/products/${id}`, dto)
      .pipe(
        map((response) => ProductMapper.mapRestProductToProduct(response)),
        tap((product) => {
          this.productByIdCache.set(id, product);
          this.clearProductsCache();
          this.triggerRefresh();
        }),
        catchError((error) => {
          console.error('Error updating product:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Eliminar producto
   * Backend retorna String, no void
   */
  deleteProduct(id: number): Observable<string> {
    return this.http.delete(`${this.envs.API_URL}/products/${id}`, { responseType: 'text' }).pipe(
      tap(() => {
        this.productByIdCache.delete(id);
        this.clearProductsCache();
        this.triggerRefresh();
      }),
      catchError((error) => {
        console.error('Error deleting product:', error);
        return throwError(() => error);
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

  /**
   * Obtener todos los productos con límite personalizado
   * Útil para páginas que necesitan listar todos los productos
   */
  fetchAllProducts(limit: number = 500): Observable<Product[]> {
    return this.http
      .get<RESTProduct>(`${this.envs.API_URL}/products`, {
        params: {
          page: 1,
          limit: limit,
        },
      })
      .pipe(
        map(({ content }) =>
          ProductMapper.mapRestProductsToProductArray(content)
        ),
        tap((products) => {
          // Actualizar el totalPage para referencia
          this.totalPage.set(Math.ceil(products.length / this.limit()));
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
