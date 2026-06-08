import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';

import { User } from '../interfaces/user.interfaces';
import { AuthResponse, Tokens } from '../interfaces/auth-response.interface';
import { environment } from '@environments/environment';

export type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated';
export type SessionAlertType = 'none' | 'inactivity' | 'invalidated';

const BASE = environment.API_URL;

const ACCESS_TOKEN_KEY  = 'access-token';
const REFRESH_TOKEN_KEY = 'refresh-token';
const USER_KEY          = 'user-data';

/** Extrae el campo `exp` (Unix seconds) del payload del JWT sin librerías. */
function parseTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  private _status      = signal<AuthStatus>('checking');
  private _user        = signal<User | null>(null);
  private _tokens      = signal<Tokens | null>(null);
  private _sessionAlert = signal<SessionAlertType>('none');

  readonly authStatus   = computed(() => this._status());
  readonly user         = computed(() => this._user());
  readonly token        = computed(() => this._tokens());
  /** Tipo de alerta de sesión activa ('none' = sin alerta) */
  readonly sessionAlert = computed(() => this._sessionAlert());

  /** Segundos restantes hasta que expire el access token. null = sin token. */
  readonly tokenSecondsLeft = signal<number | null>(null);

  constructor() {
    this._initFromStorage();
    this._startTokenCountdown();
  }

  // ─── Inicialización ─────────────────────────────────────────────

  private _initFromStorage(): void {
    const accessToken  = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const rawUser      = localStorage.getItem(USER_KEY);

    if (!accessToken || !rawUser) {
      this._status.set('not-authenticated');
      return;
    }

    try {
      const user = JSON.parse(rawUser) as User;
      this._user.set(user);
      this._tokens.set({ accessToken, refreshToken: refreshToken ?? '' });
      this._status.set('authenticated');
    } catch {
      this._clearAuthState();
      this._status.set('not-authenticated');
    }
  }

  // ─── Tokens — acceso público ─────────────────────────────────────

  getAccessToken(): string | null {
    return this._tokens()?.accessToken ?? localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return this._tokens()?.refreshToken ?? localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  isAccessTokenExpiringSoon(thresholdMs = 120_000): boolean {
    const token = this.getAccessToken();
    if (!token) return true;
    const expiry = parseTokenExpiry(token);
    if (!expiry) return true;
    return expiry - Date.now() < thresholdMs;
  }

  isAccessTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;
    const expiry = parseTokenExpiry(token);
    if (!expiry) return true;
    return Date.now() > expiry;
  }

  // ─── Auth operations ─────────────────────────────────────────────

  login(username: string, password: string): Observable<boolean> {
    return this.http
      .post<AuthResponse>(`${BASE}/auth/login`, { username, password })
      .pipe(
        map(resp => this._handleSuccess(resp)),
        catchError(() => {
          this._clearAuthState();
          return of(false);
        })
      );
  }

  /**
   * Valida el token con el backend.
   * Solo limpia el estado si falla — NO navega (puede llamarse desde guards).
   */
  checkStatus(): Observable<boolean> {
    const token = this.getAccessToken();
    if (!token) {
      this._clearAuthState();
      return of(false);
    }

    return this.http
      .get<AuthResponse>(`${BASE}/auth/check-status`)
      .pipe(
        map(resp => this._handleSuccess(resp)),
        catchError(() => {
          this._clearAuthState();
          return of(false);
        })
      );
  }

  /**
   * Intenta renovar el access token con el refresh token.
   * Solo limpia el estado si falla — NO navega (es llamado desde el interceptor).
   */
  refreshAccessToken(): Observable<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this._clearAuthState();
      return of(false);
    }

    return this.http
      .post<{ accessToken: string; refreshToken: string }>(
        `${BASE}/auth/refresh-token`,
        { refreshToken }
      )
      .pipe(
        tap(tokens => {
          this._tokens.set(tokens);
          localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
          if (tokens.refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
          }
        }),
        map(() => true),
        catchError(() => {
          this._clearAuthState();  // Solo limpia — el interceptor maneja la navegación
          return of(false);
        })
      );
  }

  /**
   * Cierra la sesión del usuario.
   * Limpia el estado Y navega a login. Solo llamar desde acciones explícitas del usuario
   * (botón logout, confirmación de modal).
   */
  logout(): void {
    const token = this.getAccessToken();
    this._clearAuthState();
    this._sessionAlert.set('none');

    if (token) {
      this.http
        .post(`${BASE}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .subscribe({ error: () => {} });
    }

    this.router.navigateByUrl('/auth/login');
  }

  /**
   * Llamado por InactivityService cuando expira por inactividad.
   * Limpia el estado pero NO navega — muestra modal para que el usuario confirme.
   */
  expireByInactivity(): void {
    this._clearAuthState();
    this._sessionAlert.set('inactivity');
  }

  /**
   * Llamado por el interceptor cuando el refresh token falla (sesión revocada
   * desde otro dispositivo o pestaña).
   * Limpia el estado pero NO navega — muestra modal informativo.
   */
  invalidateFromExternal(): void {
    this._clearAuthState();
    this._sessionAlert.set('invalidated');
  }

  /** El usuario reconoció la alerta → navegar a login y limpiar alerta. */
  acknowledgeExpiry(): void {
    this._sessionAlert.set('none');
    this.router.navigateByUrl('/auth/login');
  }

  // ─── Helpers privados ────────────────────────────────────────────

  private _handleSuccess({ tokens, user }: AuthResponse): boolean {
    this._user.set(user);
    this._tokens.set(tokens);
    this._status.set('authenticated');

    localStorage.setItem(ACCESS_TOKEN_KEY,  tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return true;
  }

  /**
   * Solo limpia el estado en memoria y localStorage.
   * No navega — úsalo en guards e interceptores.
   */
  private _clearAuthState(): void {
    this._status.set('not-authenticated');
    this._user.set(null);
    this._tokens.set(null);
    this._clearStorage();
  }

  private _clearStorage(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private _startTokenCountdown(): void {
    setInterval(() => {
      const token = this.getAccessToken();
      if (!token) { this.tokenSecondsLeft.set(null); return; }
      const expiry = parseTokenExpiry(token);
      if (!expiry) { this.tokenSecondsLeft.set(null); return; }
      const secs = Math.floor((expiry - Date.now()) / 1000);
      this.tokenSecondsLeft.set(secs > 0 ? secs : 0);
    }, 1000);
  }
}
