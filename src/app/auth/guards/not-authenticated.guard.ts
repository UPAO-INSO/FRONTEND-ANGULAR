import { inject } from '@angular/core';
import { CanMatchFn, Route, Router, UrlSegment } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '@auth/services/auth.service';
import { InactivityService } from '@shared/services/inactivity.service';

export const NotAuthenticatedGuard: CanMatchFn = async (
  _route: Route,
  _segments: UrlSegment[]
) => {
  const auth       = inject(AuthService);
  const inactivity = inject(InactivityService);
  const router     = inject(Router);

  // Si hay token en memoria/storage, validar con el backend
  const hasToken = !!auth.getAccessToken();

  if (!hasToken) {
    // Sin token → permitir acceso a /auth
    inactivity.stop();
    return true;
  }

  // Hay token → verificar con el backend
  const isAuthenticated = await firstValueFrom(auth.checkStatus());

  if (isAuthenticated) {
    inactivity.start();
    router.navigateByUrl('/dashboard');
    return false;
  }

  // Token inválido → limpiar (ya hecho en checkStatus) y permitir /auth
  inactivity.stop();
  return true;
};
