import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { RESTTable, TableStatus } from '../interfaces/table.interface';

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

  fetchTables(options: Options): Observable<RESTTable> {
    const { limit = 8, page = 1, status = '' } = options;

    return this.http
      .get<RESTTable>(`${this.envs.API_URL}/tables`, {
        params: {
          page,
          limit,
          status,
        },
      })
      .pipe(
        catchError((error) => {
          console.log({ error });

          return throwError(() => new Error('Error al cargar las mesas'));
        })
      );
  }
}
