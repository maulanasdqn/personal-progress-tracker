import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Only add auth header for admin API calls
  if (!req.url.includes('/api/admin')) {
    return next(req);
  }

  // Skip auth header for login validation endpoint
  if (req.url.includes('/api/admin/auth/validate')) {
    return next(req);
  }

  const authService = inject(AuthService);
  const password = authService.getPassword();

  if (password) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${password}`,
      },
    });
    return next(authReq);
  }

  return next(req);
};
