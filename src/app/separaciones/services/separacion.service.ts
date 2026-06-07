import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { CreateSeparacionRequest, Separacion, SeparacionStatus } from '../interfaces/separacion.interface';

@Injectable({ providedIn: 'root' })
export class SeparacionService {
  private http = inject(HttpClient);
  private base = `${environment.API_URL}/separaciones`;

  findToday(): Observable<Separacion[]> {
    return this.http.get<Separacion[]>(`${this.base}/hoy`);
  }

  findByDate(fecha: string): Observable<Separacion[]> {
    return this.http.get<Separacion[]>(`${this.base}/por-fecha`, { params: { fecha } });
  }

  create(dto: CreateSeparacionRequest): Observable<Separacion> {
    return this.http.post<Separacion>(this.base, dto);
  }

  changeStatus(id: number, status: SeparacionStatus): Observable<Separacion> {
    return this.http.patch<Separacion>(`${this.base}/${id}/estado`, { status });
  }

  cancel(id: number): Observable<string> {
    return this.http.patch<string>(`${this.base}/${id}/cancelar`, {});
  }
}
