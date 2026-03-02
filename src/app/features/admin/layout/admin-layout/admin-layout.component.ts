import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
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
              <a routerLink="/admin/dashboard" class="text-xl font-bold text-gray-900">
                Progress Tracker
              </a>
              <nav class="ml-10 flex space-x-4">
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
            <button
              type="button"
              (click)="logout()"
              class="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <!-- Main content -->
      <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService);

  protected logout(): void {
    this.authService.logout();
  }
}
