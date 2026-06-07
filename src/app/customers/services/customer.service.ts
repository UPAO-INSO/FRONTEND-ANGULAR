import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Customer, CreateCustomerRequest } from '../interfaces/customer.interface';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private http = inject(HttpClient);
  private envs = environment;

  searchByName(q: string): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.envs.API_URL}/customers/search`, { params: { q } });
  }

  create(request: CreateCustomerRequest): Observable<Customer> {
    return this.http.post<Customer>(`${this.envs.API_URL}/customers`, request);
  }
}
