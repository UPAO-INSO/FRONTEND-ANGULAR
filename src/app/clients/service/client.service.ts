import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '@src/environments/environment';
import {
  Client,
  CreateClientRequest,
  RESTClient,
} from '../interfaces/client.interface';
import {
  RESTDniResponse,
  RESTRucResponse,
} from '@src/app/shared/interfaces/factiliza.interface';

interface ClientOptions {
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.API_URL}`;

  createClient(client: CreateClientRequest): Observable<Client> {
    return this.http.post<Client>(`${this.baseUrl}/customers`, client).pipe(
      catchError((error) => {
        console.error('Error creating client:', error);
        return throwError(
          () =>
            new Error(
              'Error al crear el cliente. Por favor, intente nuevamente.'
            )
        );
      })
    );
  }

  consultarDNI(dni: string): Observable<RESTDniResponse> {
    return this.http
      .get<RESTDniResponse>(`${this.baseUrl}/factiliza/consultar/dni/${dni}`)
      .pipe(
        catchError((error) => {
          console.error('Error consulting DNI:', error);
          return throwError(
            () =>
              new Error(
                'Error al consultar el DNI. Por favor, intente nuevamente.'
              )
          );
        })
      );
  }

  consultarRUC(ruc: string): Observable<RESTRucResponse> {
    return this.http
      .get<RESTRucResponse>(`${this.baseUrl}/factiliza/consultar/ruc/${ruc}`)
      .pipe(
        catchError((error) => {
          console.error('Error consulting RUC:', error);
          return throwError(
            () =>
              new Error(
                'Error al consultar el RUC. Por favor, intente nuevamente.'
              )
          );
        })
      );
  }

  fetchClients(options: ClientOptions = {}): Observable<Client[]> {
    const { page = 1, limit = 10 } = options;

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', limit.toString());

    return this.http
      .get<RESTClient>(`${this.baseUrl}/customers`, { params })
      .pipe(map((clients) => clients.content));
  }

  searchByDocument(document: string): Observable<Client[]> {
    return this.http.get<Client[]>(
      `${this.baseUrl}/customers/document/${document}`
    );
  }
}
