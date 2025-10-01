import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { User } from '../interfaces/user.interfaces';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { AuthResponse, Tokens } from '../interfaces/auth-response.interface';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated';
const baseUrl = environment.API_URL;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _authStatus = signal('checking');
  private _user = signal<User | null>(null);
  private _token = signal<Tokens | null>(null);
  private _initialized = signal(false);

  private http = inject(HttpClient);

  private readonly ACCESS_TOKEN_KEY = 'access-token';
  private readonly REFRESH_TOKEN_KEY = 'refresh-token';
  private readonly USER_KEY = 'user-data';

  private initializationEffect = effect(() => {
    if (!this._initialized()) {
      console.log('Initializing auth from storage...');
      this.initializeFromStorage();
      this._initialized.set(true);
    }
  });

  checkStatusResource = rxResource({
    stream: () => {
      if (!this._initialized()) {
        return of(false);
      }
      return this.checkStatus();
    },
  });

  authStatus = computed<AuthStatus>(() => {
    if (!this._initialized()) return 'checking';

    if (this._authStatus() === 'checking') return 'checking';

    if (this._user()) return 'authenticated';

    return 'not-authenticated';
  });

  user = computed(() => this._user());
  token = computed(() => this._token());

  private initializeFromStorage(): void {
    try {
      const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      const userData = localStorage.getItem(this.USER_KEY);

      console.log('Storage data:', {
        hasToken: !!accessToken,
        hasRefresh: !!refreshToken,
        hasUser: !!userData,
      });

      if (accessToken && userData) {
        const user = JSON.parse(userData);
        const tokens: Tokens = {
          accessToken,
          refreshToken: refreshToken || '',
        };

        this._user.set(user);
        this._token.set(tokens);
        this._authStatus.set('authenticated');
      } else {
        this._authStatus.set('not-authenticated');
      }
    } catch (error) {
      console.error('Error initializing from storage:', error);
      this.handleAuthError(error);
    }
  }

  getAccessToken(): string | null {
    const tokenFromSignal = this._token()?.accessToken;
    if (tokenFromSignal) {
      return tokenFromSignal;
    }

    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  etRefreshToken(): string | null {
    const tokenFromSignal = this._token()?.refreshToken;
    if (tokenFromSignal) {
      return tokenFromSignal;
    }

    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  login(username: string, password: string): Observable<boolean> {
    return this.http
      .post<AuthResponse>(`${baseUrl}/auth/login`, {
        username,
        password,
      })
      .pipe(
        map((resp) => this.handleAuthSuccess(resp)),
        catchError((error: any) => this.handleAuthError(error))
      );
  }

  checkStatus(): Observable<boolean> {
    const token = this.getAccessToken();

    if (!token) {
      this.logout();
      return of(false);
    }

    return this.http.get<AuthResponse>(`${baseUrl}/auth/check-status`).pipe(
      map((resp) => this.handleAuthSuccess(resp)),
      catchError((error: any) => this.handleAuthError(error))
    );
  }

  logout() {
    this._authStatus.set('not-authenticated');
    this._user.set(null);
    this._token.set(null);

    this.clearStorage();

    this.http.post(`${baseUrl}/auth/logout`, {});
  }

  private handleAuthSuccess({ tokens, user }: AuthResponse): boolean {
    this._user.set(user);
    this._authStatus.set('authenticated');
    this._token.set(tokens);

    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));

    return true;
  }

  private handleAuthError(error: any): Observable<boolean> {
    console.log({ error });

    this.logout();
    return of(false);
  }

  private clearStorage(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}
