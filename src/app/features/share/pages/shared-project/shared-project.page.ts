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
import { RupiahPipe } from '../../../../shared/pipes/rupiah.pipe';
import type { SharedProject, IssueWithProgress, IssueStatus, IssuePriority } from '../../../../models';

type IssueSortOption = 'updated' | 'title' | 'priority' | 'status' | 'due_date';

@Component({
  selector: 'app-shared-project-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RupiahPipe,
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
          <div class="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <h1 class="truncate text-xl font-bold text-gray-900 sm:text-2xl">{{ project()!.name }}</h1>
                @if (project()!.client_name) {
                  <p class="mt-1 truncate text-sm text-gray-500">Client: {{ project()!.client_name }}</p>
                }
              </div>
              <app-status-badge [status]="project()!.status" />
            </div>
          </div>
        </header>

        <!-- Content -->
        <main class="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <!-- Project Info -->
          @if (project()!.description || project()!.deadline || project()!.budget) {
            <app-card containerClass="mb-6 sm:mb-8">
              <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
                @if (project()!.deadline) {
                  <div>
                    <p class="text-xs font-medium text-gray-500 sm:text-sm">Deadline</p>
                    <p class="mt-1 text-sm text-gray-900">
                      {{ project()!.deadline | date: 'MMM d, y' }}
                    </p>
                  </div>
                }
                @if (project()!.budget) {
                  <div>
                    <p class="text-xs font-medium text-gray-500 sm:text-sm">Budget</p>
                    <p class="mt-1 truncate text-sm text-gray-900">{{ project()!.budget | rupiah }}</p>
                  </div>
                }
                <div>
                  <p class="text-xs font-medium text-gray-500 sm:text-sm">Last Updated</p>
                  <p class="mt-1 text-sm text-gray-900">
                    {{ project()!.updated_at | date: 'MMM d, y' }}
                  </p>
                </div>
              </div>
              @if (project()!.description) {
                <div class="mt-4 border-t pt-4">
                  <p class="text-xs font-medium text-gray-500 sm:text-sm">Description</p>
                  <p class="mt-1 text-sm text-gray-900">{{ project()!.description }}</p>
                </div>
              }
            </app-card>
          }

          <!-- Overall Progress -->
          <app-card title="Overall Progress" containerClass="mb-6 sm:mb-8">
            <app-progress-bar [percentage]="overallProgress()" />
            <div class="mt-4 grid grid-cols-3 gap-2 text-center sm:gap-4">
              <div>
                <p class="text-xl font-semibold text-gray-900 sm:text-2xl">{{ todoCount() }}</p>
                <p class="text-xs text-gray-500 sm:text-sm">To Do</p>
              </div>
              <div>
                <p class="text-xl font-semibold text-yellow-600 sm:text-2xl">{{ inProgressCount() }}</p>
                <p class="text-xs text-gray-500 sm:text-sm">In Progress</p>
              </div>
              <div>
                <p class="text-xl font-semibold text-green-600 sm:text-2xl">{{ doneCount() }}</p>
                <p class="text-xs text-gray-500 sm:text-sm">Completed</p>
              </div>
            </div>
          </app-card>

          <!-- Issues -->
          <h2 class="mb-4 text-base font-medium text-gray-900 sm:mb-6 sm:text-lg">Tasks</h2>
          @if (project()!.issues.length === 0) {
            <div class="rounded-xl bg-white p-6 shadow sm:p-8">
              <p class="text-center text-sm text-gray-500 sm:text-base">No tasks have been created yet.</p>
            </div>
          } @else {
            <!-- Search, Sort, Filter -->
            <div class="mb-4 space-y-3 sm:mb-6">
              <div class="relative">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  [value]="searchQuery()"
                  (input)="onSearchChange($event)"
                  class="block w-full rounded-md border border-gray-300 py-2.5 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <svg class="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div class="grid grid-cols-3 gap-2 sm:flex sm:gap-2">
                <select
                  [value]="filterStatus()"
                  (change)="onFilterStatusChange($event)"
                  class="w-full rounded-md border border-gray-300 py-2.5 pl-2 pr-6 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-auto sm:pl-3 sm:pr-8 sm:text-sm"
                >
                  <option value="all">Status</option>
                  <option value="todo">To Do</option>
                  <option value="in-progress">Progress</option>
                  <option value="done">Done</option>
                </select>
                <select
                  [value]="filterPriority()"
                  (change)="onFilterPriorityChange($event)"
                  class="w-full rounded-md border border-gray-300 py-2.5 pl-2 pr-6 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-auto sm:pl-3 sm:pr-8 sm:text-sm"
                >
                  <option value="all">Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  [value]="sortBy()"
                  (change)="onSortChange($event)"
                  class="w-full rounded-md border border-gray-300 py-2.5 pl-2 pr-6 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-auto sm:pl-3 sm:pr-8 sm:text-sm"
                >
                  <option value="updated">Recent</option>
                  <option value="title">Title</option>
                  <option value="priority">Priority</option>
                  <option value="status">Status</option>
                  <option value="due_date">Due</option>
                </select>
              </div>
            </div>

            @if (filteredIssues().length === 0) {
              <div class="rounded-xl bg-white p-6 shadow sm:p-8">
                <p class="text-center text-sm text-gray-500 sm:text-base">No matching tasks found. Try adjusting your filters.</p>
              </div>
            } @else {
              @for (issue of filteredIssues(); track issue.id) {
              <div class="mb-4 rounded-xl bg-white p-4 shadow-md sm:mb-8 sm:p-6 lg:p-8">
                <div class="mb-3 sm:mb-4">
                  <div class="flex items-start justify-between gap-2">
                    <h3 class="text-base font-semibold text-gray-900 sm:text-lg">{{ issue.title }}</h3>
                    <div class="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
                      <app-priority-badge [priority]="issue.priority" />
                      <app-status-badge [status]="issue.status" />
                    </div>
                  </div>
                  @if (issue.description) {
                    <p class="mt-2 text-sm text-gray-600">{{ issue.description }}</p>
                  }
                </div>
                @if (issue.due_date) {
                  <p class="mb-3 text-xs text-gray-500 sm:mb-4 sm:text-sm">
                    Due: {{ issue.due_date | date: 'MMM d, y' }}
                  </p>
                }

                <!-- Progress entries -->
                @if (issue.progress.length > 0) {
                  <div class="mt-4 border-t border-gray-200 pt-4 sm:mt-6 sm:pt-6">
                    <p class="mb-3 text-sm font-medium text-gray-700 sm:mb-4">Progress Updates</p>
                    <div class="space-y-3 sm:space-y-4">
                      @for (entry of issue.progress; track entry.id) {
                        <div class="rounded-lg bg-gray-100 p-3 sm:p-5">
                          <div class="mb-2 sm:mb-3">
                            <app-progress-bar [percentage]="entry.completion_percentage" />
                          </div>
                          <p class="text-sm text-gray-900">{{ entry.description }}</p>
                          <p class="mt-1.5 text-xs text-gray-500 sm:mt-2 sm:text-sm">
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

  // Search, sort, filter
  protected readonly searchQuery = signal('');
  protected readonly sortBy = signal<IssueSortOption>('updated');
  protected readonly filterStatus = signal<IssueStatus | 'all'>('all');
  protected readonly filterPriority = signal<IssuePriority | 'all'>('all');

  protected readonly filteredIssues = computed(() => {
    const proj = this.project();
    if (!proj) return [];

    let result = proj.issues;

    // Filter by status
    const status = this.filterStatus();
    if (status !== 'all') {
      result = result.filter((i) => i.status === status);
    }

    // Filter by priority
    const priority = this.filterPriority();
    if (priority !== 'all') {
      result = result.filter((i) => i.priority === priority);
    }

    // Search
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(query) ||
          i.description?.toLowerCase().includes(query)
      );
    }

    // Sort
    const sort = this.sortBy();
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const statusOrder: Record<string, number> = { todo: 0, 'in-progress': 1, done: 2 };

    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'priority':
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'status':
          return statusOrder[a.status] - statusOrder[b.status];
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return a.due_date.localeCompare(b.due_date);
        case 'updated':
        default:
          return b.updated_at.localeCompare(a.updated_at);
      }
    });

    return result;
  });

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

  protected onSearchChange(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected onSortChange(event: Event): void {
    this.sortBy.set((event.target as HTMLSelectElement).value as IssueSortOption);
  }

  protected onFilterStatusChange(event: Event): void {
    this.filterStatus.set((event.target as HTMLSelectElement).value as IssueStatus | 'all');
  }

  protected onFilterPriorityChange(event: Event): void {
    this.filterPriority.set((event.target as HTMLSelectElement).value as IssuePriority | 'all');
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
