import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { InactivityService } from '@shared/services/inactivity.service';
import { AuthService } from '@auth/services/auth.service';

/**
 * Protege las rutas autenticadas (el shell principal).
 * Sin token en storage → redirige a /auth/login directamente.
 */
export const AuthGuard: CanActivateFn = () => {
  const auth       = inject(AuthService);
  const router     = inject(Router);
  const inactivity = inject(InactivityService);

  if (auth.getAccessToken()) {
    inactivity.start();
    return true;
  }

  inactivity.stop();
  return router.createUrlTree(['/auth/login']);
};
