import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  filter,
  Observable,
  switchMap,
  take,
  throwError,
} from 'rxjs';

import { AuthService } from '@auth/services/auth.service';

// ── Estado compartido del refresh (singleton por sesión de módulo) ──
let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<string | null>(null);

// Endpoints que se pasan directamente sin interceptar el token ni hacer refresh
const SKIP_INTERCEPTOR = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh-token',
  '/auth/logout',
];

// Endpoints que llevan token pero NO deben hacer refresh automático en 401
// (se encargan de su propio manejo de errores)
const SKIP_REFRESH = ['/auth/check-status'];

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  if (SKIP_INTERCEPTOR.some(p => req.url.includes(p))) {
    return next(req);
  }

  const auth = inject(AuthService);

  // Para check-status: solo agregar Bearer, sin refresh automático
  if (SKIP_REFRESH.some(p => req.url.includes(p))) {
    return next(addBearer(req, auth.getAccessToken()));
  }

  return handleRequest(req, next, auth);
}

function handleRequest(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService
): Observable<HttpEvent<unknown>> {
  // Refresh proactivo si el token expira pronto pero sigue siendo válido
  if (auth.isAccessTokenExpiringSoon() && !auth.isAccessTokenExpired()) {
    return refreshAndRetry(req, next, auth);
  }

  return next(addBearer(req, auth.getAccessToken())).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        return refreshAndRetry(req, next, auth);
      }
      return throwError(() => err);
    })
  );
}

function refreshAndRetry(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService
): Observable<HttpEvent<unknown>> {
  if (isRefreshing) {
    // Esperar al refresh que ya está en curso
    return refreshDone$.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next(addBearer(req, token)))
    );
  }

  isRefreshing = true;
  refreshDone$.next(null);

  return auth.refreshAccessToken().pipe(
    switchMap(success => {
      isRefreshing = false;
      if (!success) {
        // El estado ya fue limpiado por refreshAccessToken
        // Navegar a login es seguro aquí porque estamos en una request normal,
        // no en un guard de navegación
        auth.logout();
        refreshDone$.next(null);
        return throwError(() => new Error('Session expired'));
      }
      const newToken = auth.getAccessToken();
      refreshDone$.next(newToken);
      return next(addBearer(req, newToken));
    }),
    catchError(err => {
      isRefreshing = false;
      refreshDone$.next(null);
      return throwError(() => err);
    })
  );
}

function addBearer(
  req: HttpRequest<unknown>,
  token: string | null
): HttpRequest<unknown> {
  if (!token) return req;
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true',
    },
  });
}
