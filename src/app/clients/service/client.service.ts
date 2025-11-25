import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '@src/environments/environment';
import { Client, RESTClient } from '../interfaces/client.interface';

interface ClientOptions {
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.API_URL}/clients`;

  fetchClients(options: ClientOptions = {}): Observable<Client[]> {
    const { page = 1, limit = 10 } = options;

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', limit.toString());

    return this.http
      .get<RESTClient>(this.baseUrl, { params })
      .pipe(map((clients) => clients.content));
  }

  searchByDocument(document: string): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.baseUrl}/document/${document}`);
  }
}
