import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { RESTTable, Table, TableStatus } from '../interfaces/table.interface';

interface Options {
  limit?: number;
  page?: number;
  status?: TableStatus;
}

@Injectable({
  providedIn: 'root',
})
export class TableService {
  private http = inject(HttpClient);

  envs = environment;
  token = localStorage.getItem('access-token');

  private tablesCache = new Map<string, RESTTable>();
  private tableByIdCache = new Map<number, Table>();
  private tablesByStatusCache = new Map<TableStatus, Table[]>();

  private readonly CACHE_TTL = 3 * 60 * 1000;
  private cacheTimestamps = new Map<string, number>();

  private isCacheValid(key: string): boolean {
    console.log('CACHE');

    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;

    const now = Date.now();
    return now - timestamp < this.CACHE_TTL;
  }

  private setCache<T>(key: string, data: T): void {
    this.cacheTimestamps.set(key, Date.now());
  }

  clearCache(): void {
    this.tablesCache.clear();
    this.tableByIdCache.clear();
    this.tablesByStatusCache.clear();
    this.cacheTimestamps.clear();
  }

  clearTableCache(tableId: number): void {
    this.tableByIdCache.delete(tableId);
  }

  clearStatusCache(status: TableStatus): void {
    this.tablesByStatusCache.delete(status);
  }

  fetchTables(options: Options): Observable<RESTTable> {
    const { limit = 8, page = 1, status = '' } = options;
    const cacheKey = `tables_${page}_${limit}_${status}`;

    if (this.isCacheValid(cacheKey)) {
      const cached = this.tablesCache.get(cacheKey);
      if (cached) {
        return of(cached);
      }
    }

    return this.http
      .get<RESTTable>(`${this.envs.API_URL}/tables`, {
        params: {
          page,
          limit,
          status,
        },
      })
      .pipe(
        tap((tables) => {
          this.tablesCache.set(cacheKey, tables);
          this.setCache(cacheKey, tables);

          tables.content.forEach((table) => {
            this.tableByIdCache.set(table.id, table);
          });
        }),
        catchError((error) => {
          console.log({ error });
          return throwError(() => new Error('Error al cargar las mesas'));
        })
      );
  }

  getCachedTable(tableId: number): Table | undefined {
    return this.tableByIdCache.get(tableId);
  }

  preloadTables(tables: Table[]): void {
    tables.forEach((table) => {
      this.tableByIdCache.set(table.id, table);
    });
  }

  getCacheStats() {
    return {
      tablesCache: this.tablesCache.size,
      tableByIdCache: this.tableByIdCache.size,
      tablesByStatusCache: this.tablesByStatusCache.size,
      cacheTimestamps: this.cacheTimestamps.size,
    };
  }
}
