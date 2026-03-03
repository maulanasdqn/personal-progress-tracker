import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-gray-100">
      <!-- Header -->
      <header class="bg-white shadow">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="flex h-16 items-center justify-between">
            <div class="flex items-center">
              <a routerLink="/admin/dashboard" class="text-lg font-bold text-gray-900 sm:text-xl">
                Progress Tracker
              </a>
              <!-- Desktop Navigation -->
              <nav class="ml-6 hidden space-x-2 sm:ml-10 sm:flex sm:space-x-4">
                <a
                  routerLink="/admin/dashboard"
                  routerLinkActive="bg-gray-100 text-gray-900"
                  [routerLinkActiveOptions]="{ exact: true }"
                  class="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  Dashboard
                </a>
                <a
                  routerLink="/admin/projects"
                  routerLinkActive="bg-gray-100 text-gray-900"
                  class="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  Projects
                </a>
              </nav>
            </div>
            <div class="flex items-center gap-2">
              <!-- Desktop Logout -->
              <button
                type="button"
                (click)="logout()"
                class="hidden rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 sm:block"
              >
                Logout
              </button>
              <!-- Mobile Menu Button -->
              <button
                type="button"
                (click)="toggleMobileMenu()"
                class="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 sm:hidden"
                aria-expanded="false"
                aria-label="Toggle menu"
              >
                @if (mobileMenuOpen()) {
                  <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                } @else {
                  <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                }
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile Menu -->
        @if (mobileMenuOpen()) {
          <div class="border-t border-gray-200 sm:hidden">
            <div class="space-y-1 px-4 pb-3 pt-2">
              <a
                routerLink="/admin/dashboard"
                routerLinkActive="bg-gray-100 text-gray-900"
                [routerLinkActiveOptions]="{ exact: true }"
                (click)="closeMobileMenu()"
                class="block rounded-md px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                Dashboard
              </a>
              <a
                routerLink="/admin/projects"
                routerLinkActive="bg-gray-100 text-gray-900"
                (click)="closeMobileMenu()"
                class="block rounded-md px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                Projects
              </a>
              <button
                type="button"
                (click)="logout()"
                class="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        }
      </header>

      <!-- Main content -->
      <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService);

  protected readonly mobileMenuOpen = signal(false);

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  protected logout(): void {
    this.authService.logout();
  }
}
