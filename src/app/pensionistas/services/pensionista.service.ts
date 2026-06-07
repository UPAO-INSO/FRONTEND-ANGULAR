import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { CreatePensionistaRequest, Pensionista, PensionistaConsumo } from '../interfaces/pensionista.interface';

@Injectable({ providedIn: 'root' })
export class PensionistaService {
  private http = inject(HttpClient);
  private base = `${environment.API_URL}/pensionistas`;

  findAll(): Observable<{ content: Pensionista[]; totalPages: number; totalElements: number }> {
    return this.http.get<{ content: Pensionista[]; totalPages: number; totalElements: number }>(this.base, {
      params: { page: 1, limit: 100 },
    });
  }

  findAllActive(): Observable<Pensionista[]> {
    return this.http.get<Pensionista[]>(`${this.base}/activos`);
  }

  findConsumos(id: number): Observable<PensionistaConsumo[]> {
    return this.http.get<PensionistaConsumo[]>(`${this.base}/${id}/consumos`);
  }

  create(dto: CreatePensionistaRequest): Observable<Pensionista> {
    return this.http.post<Pensionista>(this.base, dto);
  }

  update(id: number, dto: CreatePensionistaRequest): Observable<Pensionista> {
    return this.http.put<Pensionista>(`${this.base}/${id}`, dto);
  }

  renew(id: number, creditos: number): Observable<Pensionista> {
    return this.http.patch<Pensionista>(`${this.base}/${id}/renovar`, null, {
      params: { creditos },
    });
  }

  deactivate(id: number): Observable<string> {
    return this.http.delete<string>(`${this.base}/${id}`);
  }
}
