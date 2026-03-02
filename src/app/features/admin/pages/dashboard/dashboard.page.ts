import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { LoadingSpinnerComponent, StatusBadgeComponent, CardComponent } from '../../../../shared/components';
import type { DashboardStats } from '../../../../models';

@Component({
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, LoadingSpinnerComponent, StatusBadgeComponent, CardComponent],
  template: `
    <div>
      <h1 class="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (stats()) {
        <!-- Stats grid -->
        <div class="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <app-card>
            <div class="text-sm font-medium text-gray-500">Total Projects</div>
            <div class="mt-1 text-3xl font-semibold text-gray-900">
              {{ stats()!.total_projects }}
            </div>
          </app-card>
          <app-card>
            <div class="text-sm font-medium text-gray-500">Active Projects</div>
            <div class="mt-1 text-3xl font-semibold text-green-600">
              {{ stats()!.active_projects }}
            </div>
          </app-card>
          <app-card>
            <div class="text-sm font-medium text-gray-500">Total Issues</div>
            <div class="mt-1 text-3xl font-semibold text-gray-900">
              {{ stats()!.total_issues }}
            </div>
          </app-card>
          <app-card>
            <div class="text-sm font-medium text-gray-500">Completed Issues</div>
            <div class="mt-1 text-3xl font-semibold text-blue-600">
              {{ stats()!.completed_issues }}
            </div>
          </app-card>
        </div>

        <!-- Recent projects -->
        <app-card title="Recent Projects">
          @if (stats()!.recent_projects.length === 0) {
            <p class="text-gray-500">No projects yet.</p>
          } @else {
            <ul class="divide-y divide-gray-200">
              @for (project of stats()!.recent_projects; track project.id) {
                <li class="py-4">
                  <a
                    [routerLink]="['/admin/projects', project.id]"
                    class="flex items-center justify-between hover:bg-gray-50"
                  >
                    <div>
                      <p class="font-medium text-gray-900">{{ project.name }}</p>
                      <p class="text-sm text-gray-500">
                        {{ project.client_name ?? 'No client' }}
                      </p>
                    </div>
                    <div class="flex items-center gap-3">
                      <app-status-badge [status]="project.status" />
                      <span class="text-sm text-gray-500">
                        {{ project.updated_at | date: 'MMM d, y' }}
                      </span>
                    </div>
                  </a>
                </li>
              }
            </ul>
          }
        </app-card>
      }
    </div>
  `,
})
export class DashboardPage implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  protected readonly loading = signal(true);
  protected readonly stats = signal<DashboardStats | null>(null);

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    this.loading.set(true);
    this.dashboardService.getStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
