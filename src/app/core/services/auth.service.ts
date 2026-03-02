import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import type { ApiResponse } from '../../models';

const STORAGE_KEY = 'admin_password';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _isAuthenticated = signal(this.hasStoredPassword());

  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly isLoggedIn = computed(() => this._isAuthenticated());

  login(password: string): Observable<boolean> {
    return this.http
      .post<ApiResponse<{ valid: boolean }>>('/api/admin/auth/validate', { password })
      .pipe(
        map((response) => {
          if (response.success && response.data?.valid) {
            localStorage.setItem(STORAGE_KEY, password);
            this._isAuthenticated.set(true);
            return true;
          }
          return false;
        }),
        catchError(() => of(false))
      );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this._isAuthenticated.set(false);
    this.router.navigate(['/admin/login']);
  }

  getPassword(): string | null {
    return localStorage.getItem(STORAGE_KEY);
  }

  validateStoredPassword(): Observable<boolean> {
    const password = this.getPassword();
    if (!password) {
      this._isAuthenticated.set(false);
      return of(false);
    }

    return this.http
      .post<ApiResponse<{ valid: boolean }>>('/api/admin/auth/validate', { password })
      .pipe(
        map((response) => {
          const valid = response.success && response.data?.valid === true;
          this._isAuthenticated.set(valid);
          if (!valid) {
            localStorage.removeItem(STORAGE_KEY);
          }
          return valid;
        }),
        catchError(() => {
          this._isAuthenticated.set(false);
          localStorage.removeItem(STORAGE_KEY);
          return of(false);
        })
      );
  }

  private hasStoredPassword(): boolean {
    return !!localStorage.getItem(STORAGE_KEY);
  }
}
