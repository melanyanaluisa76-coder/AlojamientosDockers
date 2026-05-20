import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '../store/auth.store';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router    = inject(Router);
  const authStore = inject(AuthStore);

  return next(req).pipe(
    catchError(error => {
      if (error.status === HttpStatusCode.Unauthorized) {
        authStore.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
