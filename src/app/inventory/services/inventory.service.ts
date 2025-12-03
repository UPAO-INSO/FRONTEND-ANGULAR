import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap, catchError, throwError, of } from 'rxjs';
import { environment } from '@environments/environment';

import {
  InventoryRequest,
  InventoryResponse,
  InventoryUpdate,
  InventoryFilter,
  PaginatedInventoryResponse,
  InventoryItem,
  InventoryType,
  mapToInventoryItem,
  ProductInventoryRequest,
  ProductInventoryResponse,
  ProductInventoryUpdate,
} from '../interfaces/inventory.interface';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private http = inject(HttpClient);
  private apiUrl = environment.API_URL;

  // Cache para optimizar
  private inventoryCache = new Map<string, InventoryItem[]>();
  private cacheTimestamps = new Map<string, number>();
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutos

  // Signals para estado reactivo
  isLoading = signal(false);
  error = signal<string | null>(null);

  // ===========================
  // CRUD de Inventory (Insumos)
  // ===========================

  /**
   * Crear un nuevo item en inventario
   * POST /inventory
   */
  create(request: InventoryRequest): Observable<InventoryResponse> {
    return this.http.post<InventoryResponse>(`${this.apiUrl}/inventory`, request).pipe(
      tap(() => this.clearCache()),
      catchError((err) => {
        console.error('Error creating inventory item:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Obtener item por ID
   * GET /inventory/{id}
   */
  getById(id: number): Observable<InventoryItem> {
    return this.http.get<InventoryResponse>(`${this.apiUrl}/inventory/${id}`).pipe(
      map((response) => mapToInventoryItem(response)),
      catchError((err) => {
        console.error('Error fetching inventory item:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Listar todos los items con paginación y filtro opcional por tipo
   * GET /inventory?page=1&limit=10&type=INGREDIENT
   */
  findAll(
    pagination: PaginationParams = {},
    type?: InventoryType
  ): Observable<PaginatedInventoryResponse> {
    let params = new HttpParams()
      .set('page', (pagination.page ?? 1).toString())
      .set('limit', (pagination.limit ?? 20).toString());

    if (type) {
      params = params.set('type', type);
    }

    const cacheKey = `findAll_${params.toString()}`;
    
    return this.http
      .get<PaginatedInventoryResponse>(`${this.apiUrl}/inventory`, { params })
      .pipe(
        map((response) => ({
          ...response,
          content: response.content.map(mapToInventoryItem),
        })),
        tap((response) => {
          this.inventoryCache.set(cacheKey, response.content as InventoryItem[]);
          this.cacheTimestamps.set(cacheKey, Date.now());
        }),
        catchError((err) => {
          console.error('Error fetching inventory:', err);
          return throwError(() => err);
        })
      );
  }

  /**
   * Buscar por nombre
   * GET /inventory/search?term=aceite
   */
  searchByName(
    pagination: PaginationParams = {},
    term: string
  ): Observable<PaginatedInventoryResponse> {
    const params = new HttpParams()
      .set('page', (pagination.page ?? 1).toString())
      .set('limit', (pagination.limit ?? 20).toString())
      .set('term', term);

    return this.http
      .get<PaginatedInventoryResponse>(`${this.apiUrl}/inventory/search`, { params })
      .pipe(
        map((response) => ({
          ...response,
          content: response.content.map(mapToInventoryItem),
        })),
        catchError((err) => {
          console.error('Error searching inventory:', err);
          return throwError(() => err);
        })
      );
  }

  /**
   * Filtrar por múltiples tipos
   * POST /inventory/filter-types
   */
  findByTypes(
    pagination: PaginationParams = {},
    types: InventoryType[]
  ): Observable<PaginatedInventoryResponse> {
    const params = new HttpParams()
      .set('page', (pagination.page ?? 1).toString())
      .set('limit', (pagination.limit ?? 20).toString());

    return this.http
      .post<PaginatedInventoryResponse>(`${this.apiUrl}/inventory/filter-types`, types, { params })
      .pipe(
        map((response) => ({
          ...response,
          content: response.content.map(mapToInventoryItem),
        })),
        catchError((err) => {
          console.error('Error filtering inventory by types:', err);
          return throwError(() => err);
        })
      );
  }

  /**
   * Filtro avanzado por nombre Y tipo
   * POST /inventory/filter
   */
  filterByNameAndType(
    pagination: PaginationParams = {},
    filter: InventoryFilter
  ): Observable<PaginatedInventoryResponse> {
    const params = new HttpParams()
      .set('page', (pagination.page ?? 1).toString())
      .set('limit', (pagination.limit ?? 20).toString());

    return this.http
      .post<PaginatedInventoryResponse>(`${this.apiUrl}/inventory/filter`, filter, { params })
      .pipe(
        map((response) => ({
          ...response,
          content: response.content.map(mapToInventoryItem),
        })),
        catchError((err) => {
          console.error('Error filtering inventory:', err);
          return throwError(() => err);
        })
      );
  }

  /**
   * Actualizar un item
   * PUT /inventory/{id}
   */
  update(id: number, request: InventoryUpdate): Observable<InventoryResponse> {
    return this.http.put<InventoryResponse>(`${this.apiUrl}/inventory/${id}`, request).pipe(
      tap(() => this.clearCache()),
      catchError((err) => {
        console.error('Error updating inventory item:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Eliminar un item
   * DELETE /inventory/{id}
   * Backend retorna String, no JSON
   */
  delete(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/inventory/${id}`, { responseType: 'text' }).pipe(
      tap(() => this.clearCache()),
      catchError((err) => {
        console.error('Error deleting inventory item:', err);
        return throwError(() => err);
      })
    );
  }

  // =====================================
  // CRUD de ProductInventory (Recetas)
  // =====================================

  /**
   * Crear relación producto-inventario (receta)
   * POST /product-inventory
   */
  createProductInventory(request: ProductInventoryRequest): Observable<ProductInventoryResponse> {
    return this.http
      .post<ProductInventoryResponse>(`${this.apiUrl}/product-inventory`, request)
      .pipe(
        catchError((err) => {
          console.error('Error creating product inventory:', err);
          return throwError(() => err);
        })
      );
  }

  /**
   * Obtener receta de un producto
   * GET /product-inventory/recipe/{productId}
   */
  getRecipe(productId: number): Observable<ProductInventoryResponse[]> {
    return this.http
      .get<ProductInventoryResponse[]>(`${this.apiUrl}/product-inventory/recipe/${productId}`)
      .pipe(
        catchError((err) => {
          console.error('Error fetching recipe:', err);
          return throwError(() => err);
        })
      );
  }

  /**
   * Obtener relación por ID
   * GET /product-inventory/{id}
   */
  getProductInventoryById(id: number): Observable<ProductInventoryResponse> {
    return this.http.get<ProductInventoryResponse>(`${this.apiUrl}/product-inventory/${id}`).pipe(
      catchError((err) => {
        console.error('Error fetching product inventory:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Listar todas las relaciones
   * GET /product-inventory
   */
  getAllProductInventories(): Observable<ProductInventoryResponse[]> {
    return this.http.get<ProductInventoryResponse[]>(`${this.apiUrl}/product-inventory`).pipe(
      catchError((err) => {
        console.error('Error fetching all product inventories:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Actualizar relación producto-inventario
   * PUT /product-inventory/{id}
   */
  updateProductInventory(
    id: number,
    request: ProductInventoryUpdate
  ): Observable<ProductInventoryResponse> {
    return this.http
      .put<ProductInventoryResponse>(`${this.apiUrl}/product-inventory/${id}`, request)
      .pipe(
        catchError((err) => {
          console.error('Error updating product inventory:', err);
          return throwError(() => err);
        })
      );
  }

  /**
   * Eliminar relación producto-inventario
   * DELETE /product-inventory/{id}
   */
  deleteProductInventory(id: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/product-inventory/${id}`).pipe(
      catchError((err) => {
        console.error('Error deleting product inventory:', err);
        return throwError(() => err);
      })
    );
  }

  // =====================================
  // Utilidades
  // =====================================

  private isCacheValid(key: string): boolean {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  clearCache(): void {
    this.inventoryCache.clear();
    this.cacheTimestamps.clear();
  }
}
