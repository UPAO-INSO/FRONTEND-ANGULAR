import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { MenuDiarioItem } from '../interfaces/menu.interface';

@Injectable({ providedIn: 'root' })
export class MenuDiarioService {
  private http = inject(HttpClient);
  private base = `${environment.API_URL}/menu-diario`;

  findToday(): Observable<MenuDiarioItem[]> {
    return this.http.get<MenuDiarioItem[]>(`${this.base}/hoy`);
  }

  saveBulk(items: { productId: number; estimatedPortions: number }[]): Observable<MenuDiarioItem[]> {
    return this.http.post<MenuDiarioItem[]>(`${this.base}/bulk`, items);
  }

  updatePortions(id: number, cantidad: number): Observable<MenuDiarioItem> {
    return this.http.patch<MenuDiarioItem>(`${this.base}/${id}/porciones`, null, {
      params: { cantidad },
    });
  }

  remove(id: number): Observable<string> {
    return this.http.delete<string>(`${this.base}/${id}`);
  }
}
