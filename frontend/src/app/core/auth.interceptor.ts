import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { catchError, throwError, switchMap } from 'rxjs';

// WHY: With HttpOnly cookies, the browser automatically sends the JWT cookie
// on every request — no need to manually attach a Bearer header.
// This interceptor handles 401 errors by attempting a silent refresh
// (the backend reads the refresh_token cookie automatically) and retrying.
// It also provides global error reporting using ToastService.

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);

  // WHY: withCredentials sends HttpOnly cookies with every cross-origin request.
  // Required because frontend (port 4200) and backend (port 8080) are different origins.
  const credentialsReq = req.clone({ withCredentials: true });

  return next(credentialsReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/')) {
        return authService.isLoggedIn().pipe(
          switchMap((loggedIn) => {
            if (!loggedIn) {
              authService.logout();
              toastService.showError('Session expired. Please sign in again.');
            }
            return next(req);
          }),
          catchError((refreshError) => {
            authService.logout();
            toastService.showError('Session expired. Please sign in again.');
            return throwError(() => refreshError);
          })
        );
      }

      // Handle other API errors globally
      if (error.status !== 401) {
        let errMsg = 'An unexpected error occurred.';
        if (error.error) {
          if (typeof error.error === 'string') {
            errMsg = error.error;
          } else if (typeof error.error === 'object') {
            if (error.error.message) {
              errMsg = error.error.message;
            } else if (error.error.error) {
              errMsg = error.error.error;
            }
          }
        } else if (error.message) {
          errMsg = error.message;
        }
        toastService.showError(errMsg);
      }

      return throwError(() => error);
    })
  );
};
