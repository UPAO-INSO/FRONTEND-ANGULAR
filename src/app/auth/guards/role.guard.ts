import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';

export const RoleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const allowedRoles: string[] = route.data['roles'] ?? [];

  try {
    const raw = localStorage.getItem('user-data');
    if (!raw) return router.createUrlTree(['/auth/login']);

    const user = JSON.parse(raw);
    const role: string = (user.role ?? '').toUpperCase();

    if (!role) return router.createUrlTree(['/auth/login']);

    // ADMINISTRADOR tiene acceso a todo
    if (role === 'ADMINISTRADOR') return true;

    // Sin restricciones definidas → solo autenticación es suficiente
    if (!allowedRoles.length) return true;

    if (allowedRoles.includes(role)) return true;
  } catch {
    return router.createUrlTree(['/auth/login']);
  }

  return router.createUrlTree(['/dashboard']);
};
