import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { map } from 'rxjs';

// WHY: Checks auth state by calling /api/auth/me (reads JWT from cookie).
// If the cookie is missing/expired, redirects to login with redirectUrl.
export const authGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isLoggedIn().pipe(
    map(loggedIn => loggedIn ? true : router.parseUrl('/login?redirectUrl=' + encodeURIComponent(state.url)))
  );
};
