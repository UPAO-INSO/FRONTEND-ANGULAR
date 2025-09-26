import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { Table, RESTTable, TableStatus } from '../interfaces/table.interface';
import { TableMapper } from '../mapper/table.mapper';

@Injectable({
  providedIn: 'root',
})
export class TableService {
  private http = inject(HttpClient);

  envs = environment;
  token = localStorage.getItem('access-token');

  page = signal(1);
  totalPages = signal(1);
  private limit = signal(8);

  tables = signal<Table[]>([]);
  filterTables = signal<Table[]>([]);

  currentPage() {
    this.page();
  }

  setPage(page: number) {
    if (page < 1) return;
    if (page > this.totalPages()) return;
    this.page.set(page);
  }

  fetchTables(page: number = 1): Observable<Table[]> {
    return this.http
      .get<RESTTable>(`${this.envs.API_URL}/tables`, {
        params: {
          page: page,
          limit: this.limit(),
        },
      })
      .pipe(
        tap((resp) => this.totalPages.set(resp.totalPages)),
        map(({ content }) => {
          const tables = TableMapper.mapRestTablesToTableArray(content);
          this.tables.set(tables);
          return tables;
        }),
        catchError((error) => {
          console.log({ error });
          this.tables.set([]);
          return throwError(() => new Error('Error al cargar las mesas'));
        })
      );
  }

  fetchFilterTables(status: TableStatus): Observable<Table[]> {
    return this.http
      .get<RESTTable>(`${this.envs.API_URL}/tables/filter-by`, {
        params: {
          status: status,
          page: this.page(),
          limit: this.limit(),
        },
      })
      .pipe(
        map(({ content }) => {
          const tables = TableMapper.mapRestTablesToTableArray(content);
          this.filterTables.set(tables);
          return tables;
        })
      );
  }

  tablesGroup() {
    const groups = [];

    const tables = this.tables() ?? [];
    for (let i = 0; i < tables.length; i += 1) {
      groups.push(tables.slice(i, i + 1));
    }

    return groups;
  }

  filterTablesGroup() {
    const groups = [];

    const tables = this.filterTables() ?? [];
    for (let i = 0; i < tables.length; i += 1) {
      groups.push(tables.slice(i, i + 1));
    }

    return groups;
  }
}
