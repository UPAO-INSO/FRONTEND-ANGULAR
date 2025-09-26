import { inject } from '@angular/core';
import { CanMatchFn, Route, Router, UrlSegment } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';

export const AuthenticatedGuard: CanMatchFn = (
  route: Route,
  segments: UrlSegment[]
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authStatus = authService.authStatus();

  if (authStatus === 'checking') {
    console.log('⏳ Still checking authentication, blocking access');
    return false;
  }

  if (authStatus === 'authenticated') {
    console.log('✅ User is authenticated, allowing access');
    return true;
  }

  router.navigateByUrl('/auth/login');
  return false;
};
