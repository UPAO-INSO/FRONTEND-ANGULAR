import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Tokens } from '@auth/interfaces/auth-response.interface';
import { AuthService } from '@auth/services/auth.service';
import { catchError, Observable, throwError } from 'rxjs';

const ongoingRequests = new Map<string, Observable<HttpEvent<unknown>>>();

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const publicEndpoints = ['/auth/login'];

  const isPublicEndpoint = publicEndpoints.some((endpoint) =>
    req.url.includes(endpoint)
  );

  if (isPublicEndpoint) {
    console.log('🔓 Public endpoint, no auth needed:', req.url);
    return next(req);
  }

  const token = inject(AuthService).token();

  const accessToken = token?.accessToken;

  if (!accessToken) return next(req);

  console.log({ accessToken });

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return next(authReq);
}
