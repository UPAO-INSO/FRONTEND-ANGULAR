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

// ── Estado compartido del refresh ────────────────────────────────────
let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<string | null>(null);

// Sentinel para notificar a la cola que el refresh falló
const REFRESH_FAILED = '__REFRESH_FAILED__';

const SKIP_INTERCEPTOR = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh-token',
  '/auth/logout',
];

const SKIP_REFRESH = ['/auth/check-status'];

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  if (SKIP_INTERCEPTOR.some(p => req.url.includes(p))) {
    return next(req);
  }

  const auth = inject(AuthService);

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
    // Esperar al refresh en curso — el sentinel REFRESH_FAILED desbloquea la cola
    return refreshDone$.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        if (token === REFRESH_FAILED) {
          return throwError(() => new Error('Session invalidated'));
        }
        return next(addBearer(req, token));
      })
    );
  }

  isRefreshing = true;
  refreshDone$.next(null);

  return auth.refreshAccessToken().pipe(
    switchMap(success => {
      isRefreshing = false;

      if (!success) {
        auth.invalidateFromExternal();
        // Emitir REFRESH_FAILED para desbloquear todos los requests en cola
        refreshDone$.next(REFRESH_FAILED);
        // Limpiar el sentinel después de un tick para el próximo ciclo
        setTimeout(() => refreshDone$.next(null), 0);
        return throwError(() => new Error('Session invalidated'));
      }

      const newToken = auth.getAccessToken();
      refreshDone$.next(newToken);
      return next(addBearer(req, newToken));
    }),
    catchError(err => {
      isRefreshing = false;
      refreshDone$.next(REFRESH_FAILED);
      setTimeout(() => refreshDone$.next(null), 0);
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
