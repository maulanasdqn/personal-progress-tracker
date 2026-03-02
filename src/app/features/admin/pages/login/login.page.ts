import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div class="w-full max-w-md">
        <div class="rounded-lg bg-white px-8 py-10 shadow">
          <h1 class="mb-8 text-center text-2xl font-bold text-gray-900">Admin Login</h1>

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="mb-6">
              <label for="password" class="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                formControlName="password"
                class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter admin password"
                [attr.aria-invalid]="form.get('password')?.invalid && form.get('password')?.touched"
              />
            </div>

            @if (error()) {
              <div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600" role="alert">
                {{ error() }}
              </div>
            }

            <button
              type="submit"
              [disabled]="loading() || form.invalid"
              class="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              @if (loading()) {
                <svg class="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
                Logging in...
              } @else {
                Login
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    password: ['', Validators.required],
  });

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    const { password } = this.form.getRawValue();

    this.authService.login(password).subscribe({
      next: (success) => {
        this.loading.set(false);
        if (success) {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] ?? '/admin/dashboard';
          this.router.navigateByUrl(returnUrl);
        } else {
          this.error.set('Invalid password');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('An error occurred. Please try again.');
      },
    });
  }
}
