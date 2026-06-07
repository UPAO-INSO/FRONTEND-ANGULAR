import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ProfilePasswordUpdate, ProfilePersonalUpdate, ProfileResponse } from '../interfaces/profile.interface';

const BASE = `${environment.API_URL}/profile`;

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);

  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(BASE);
  }

  updatePersonal(dto: ProfilePersonalUpdate): Observable<ProfileResponse> {
    return this.http.patch<ProfileResponse>(`${BASE}/personal`, dto);
  }

  updateUsername(username: string): Observable<ProfileResponse> {
    return this.http.patch<ProfileResponse>(`${BASE}/username`, null, {
      params: { username },
    });
  }

  updateEmail(email: string): Observable<ProfileResponse> {
    return this.http.patch<ProfileResponse>(`${BASE}/email`, null, {
      params: { email },
    });
  }

  updatePassword(dto: ProfilePasswordUpdate): Observable<void> {
    return this.http.patch<void>(`${BASE}/password`, dto);
  }
}
