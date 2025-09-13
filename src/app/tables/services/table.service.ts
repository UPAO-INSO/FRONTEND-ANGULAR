import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable, map, tap } from 'rxjs';
import { Table, RESTTable } from '../interfaces/table.interface';
import { TableMapper } from '../mapper/table.mapper';

@Injectable({
  providedIn: 'root',
})
export class TableService {
  private http = inject(HttpClient);

  envs = environment;
  token = this.envs.API_TOKEN;

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

  fetchTables(page = this.page()): Observable<Table[]> {
    return this.http
      .get<RESTTable>(`${this.envs.API_URL}/tables`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
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
        })
      );
  }

  fetchFilterTables(status: string): Observable<Table[]> {
    status = status.toUpperCase();

    return this.http
      .get<RESTTable>(`${this.envs.API_URL}/tables/filter-by`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
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
