import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If already authenticated, allow access
  if (authService.isAuthenticated()) {
    return true;
  }

  // Otherwise, validate stored password
  return authService.validateStoredPassword().pipe(
    take(1),
    map((valid) => {
      if (valid) {
        return true;
      }
      return router.createUrlTree(['/admin/login'], {
        queryParams: { returnUrl: state.url },
      });
    })
  );
};
