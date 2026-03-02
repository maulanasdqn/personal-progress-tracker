import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ShareService } from '../../services/share.service';
import {
  LoadingSpinnerComponent,
  StatusBadgeComponent,
  PriorityBadgeComponent,
  ProgressBarComponent,
  CardComponent,
} from '../../../../shared/components';
import type { SharedProject, IssueWithProgress } from '../../../../models';

@Component({
  selector: 'app-shared-project-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
    PriorityBadgeComponent,
    ProgressBarComponent,
    CardComponent,
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      @if (loading()) {
        <div class="flex min-h-screen items-center justify-center">
          <app-loading-spinner size="lg" />
        </div>
      } @else if (error()) {
        <div class="flex min-h-screen flex-col items-center justify-center px-4">
          <div class="text-center">
            <h1 class="mb-2 text-2xl font-bold text-gray-900">Project Not Found</h1>
            <p class="text-gray-500">This project link may be invalid or has expired.</p>
          </div>
        </div>
      } @else if (project()) {
        <!-- Header -->
        <header class="border-b bg-white">
          <div class="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
            <div class="flex items-start justify-between">
              <div>
                <h1 class="text-2xl font-bold text-gray-900">{{ project()!.name }}</h1>
                @if (project()!.client_name) {
                  <p class="mt-1 text-sm text-gray-500">Client: {{ project()!.client_name }}</p>
                }
              </div>
              <app-status-badge [status]="project()!.status" />
            </div>
          </div>
        </header>

        <!-- Content -->
        <main class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <!-- Project Info -->
          @if (project()!.description || project()!.deadline || project()!.budget) {
            <app-card containerClass="mb-8">
              <div class="grid gap-4 sm:grid-cols-3">
                @if (project()!.deadline) {
                  <div>
                    <p class="text-sm font-medium text-gray-500">Deadline</p>
                    <p class="mt-1 text-sm text-gray-900">
                      {{ project()!.deadline | date: 'MMMM d, y' }}
                    </p>
                  </div>
                }
                @if (project()!.budget) {
                  <div>
                    <p class="text-sm font-medium text-gray-500">Budget</p>
                    <p class="mt-1 text-sm text-gray-900">\${{ project()!.budget }}</p>
                  </div>
                }
                <div>
                  <p class="text-sm font-medium text-gray-500">Last Updated</p>
                  <p class="mt-1 text-sm text-gray-900">
                    {{ project()!.updated_at | date: 'MMMM d, y' }}
                  </p>
                </div>
              </div>
              @if (project()!.description) {
                <div class="mt-4 border-t pt-4">
                  <p class="text-sm font-medium text-gray-500">Description</p>
                  <p class="mt-1 text-sm text-gray-900">{{ project()!.description }}</p>
                </div>
              }
            </app-card>
          }

          <!-- Overall Progress -->
          <app-card title="Overall Progress" containerClass="mb-8">
            <app-progress-bar [percentage]="overallProgress()" />
            <div class="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p class="text-2xl font-semibold text-gray-900">{{ todoCount() }}</p>
                <p class="text-sm text-gray-500">To Do</p>
              </div>
              <div>
                <p class="text-2xl font-semibold text-yellow-600">{{ inProgressCount() }}</p>
                <p class="text-sm text-gray-500">In Progress</p>
              </div>
              <div>
                <p class="text-2xl font-semibold text-green-600">{{ doneCount() }}</p>
                <p class="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </app-card>

          <!-- Issues -->
          <h2 class="mb-6 text-lg font-medium text-gray-900">Tasks</h2>
          @if (project()!.issues.length === 0) {
            <div class="rounded-xl bg-white p-8 shadow">
              <p class="text-center text-gray-500">No tasks have been created yet.</p>
            </div>
          } @else {
            @for (issue of project()!.issues; track issue.id) {
              <div class="mb-8 rounded-xl bg-white p-6 shadow-md sm:p-8">
                <div class="mb-4 flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold text-gray-900">{{ issue.title }}</h3>
                    @if (issue.description) {
                      <p class="mt-2 text-gray-600">{{ issue.description }}</p>
                    }
                  </div>
                  <div class="flex items-center gap-2">
                    <app-priority-badge [priority]="issue.priority" />
                    <app-status-badge [status]="issue.status" />
                  </div>
                </div>
                @if (issue.due_date) {
                  <p class="mb-4 text-sm text-gray-500">
                    Due: {{ issue.due_date | date: 'MMM d, y' }}
                  </p>
                }

                <!-- Progress entries -->
                @if (issue.progress.length > 0) {
                  <div class="mt-6 border-t border-gray-200 pt-6">
                    <p class="mb-4 font-medium text-gray-700">Progress Updates</p>
                    <div class="space-y-4">
                      @for (entry of issue.progress; track entry.id) {
                        <div class="rounded-lg bg-gray-100 p-5">
                          <div class="mb-3">
                            <app-progress-bar [percentage]="entry.completion_percentage" />
                          </div>
                          <p class="text-gray-900">{{ entry.description }}</p>
                          <p class="mt-2 text-sm text-gray-500">
                            {{ entry.created_at | date: 'MMM d, y, h:mm a' }}
                          </p>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          }
        </main>

        <!-- Footer -->
        <footer class="border-t bg-white py-6">
          <div class="mx-auto max-w-4xl px-4 text-center text-sm text-gray-500 sm:px-6 lg:px-8">
            Progress Tracker
          </div>
        </footer>
      }
    </div>
  `,
})
export class SharedProjectPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly shareService = inject(ShareService);

  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly project = signal<SharedProject | null>(null);

  protected readonly overallProgress = computed(() => {
    const proj = this.project();
    if (!proj || proj.issues.length === 0) return 0;

    const total = proj.issues.length;
    const done = proj.issues.filter((i) => i.status === 'done').length;
    const inProgress = proj.issues.filter((i) => i.status === 'in-progress').length;

    return Math.round(((done + inProgress * 0.5) / total) * 100);
  });

  protected readonly todoCount = computed(() => {
    return this.project()?.issues.filter((i) => i.status === 'todo').length ?? 0;
  });

  protected readonly inProgressCount = computed(() => {
    return this.project()?.issues.filter((i) => i.status === 'in-progress').length ?? 0;
  });

  protected readonly doneCount = computed(() => {
    return this.project()?.issues.filter((i) => i.status === 'done').length ?? 0;
  });

  ngOnInit(): void {
    const shareToken = this.route.snapshot.params['shareToken'];
    this.loadProject(shareToken);
  }

  private loadProject(shareToken: string): void {
    this.loading.set(true);
    this.error.set(false);

    this.shareService.getProject(shareToken).subscribe({
      next: (project) => {
        this.project.set(project);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
