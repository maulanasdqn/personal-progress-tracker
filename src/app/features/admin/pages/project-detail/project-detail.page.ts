import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ProjectService } from '../../services/project.service';
import { IssueService } from '../../services/issue.service';
import { RupiahPipe } from '../../../../shared/pipes/rupiah.pipe';
import {
  LoadingSpinnerComponent,
  EmptyStateComponent,
  StatusBadgeComponent,
  PriorityBadgeComponent,
  DialogComponent,
  CardComponent,
} from '../../../../shared/components';
import type { Project, Issue, CreateIssueDto, IssueStatus, IssuePriority } from '../../../../models';

type IssueSortOption = 'updated' | 'title' | 'priority' | 'status' | 'due_date';

@Component({
  selector: 'app-project-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DatePipe,
    RupiahPipe,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    PriorityBadgeComponent,
    DialogComponent,
    CardComponent,
  ],
  template: `
    <div>
      @if (loading()) {
        <app-loading-spinner />
      } @else if (project()) {
        <!-- Header -->
        <div class="mb-4 sm:mb-6">
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <a routerLink="/admin/projects" class="hover:text-gray-700">Projects</a>
            <span>/</span>
            <span class="truncate">{{ project()!.name }}</span>
          </div>
          <div class="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-2 sm:gap-3">
              <h1 class="text-xl font-bold text-gray-900 sm:text-2xl">{{ project()!.name }}</h1>
              <app-status-badge [status]="project()!.status" />
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                (click)="copyShareLink()"
                class="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:flex-none"
              >
                {{ copied() ? 'Copied!' : 'Share' }}
              </button>
              <button
                type="button"
                (click)="deleteProject()"
                class="rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        <!-- Project Info -->
        <app-card containerClass="mb-4 sm:mb-6">
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            <div>
              <p class="text-xs font-medium text-gray-500 sm:text-sm">Client</p>
              <p class="mt-1 truncate text-sm text-gray-900">{{ project()!.client_name ?? 'Not set' }}</p>
            </div>
            <div>
              <p class="text-xs font-medium text-gray-500 sm:text-sm">Contact</p>
              <p class="mt-1 truncate text-sm text-gray-900">{{ project()!.client_contact ?? 'Not set' }}</p>
            </div>
            <div>
              <p class="text-xs font-medium text-gray-500 sm:text-sm">Budget</p>
              <p class="mt-1 truncate text-sm text-gray-900">
                {{ project()!.budget ? (project()!.budget | rupiah) : 'Not set' }}
              </p>
            </div>
            <div>
              <p class="text-xs font-medium text-gray-500 sm:text-sm">Deadline</p>
              <p class="mt-1 text-sm text-gray-900">
                {{ project()!.deadline ? (project()!.deadline | date: 'MMM d, y') : 'Not set' }}
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

        <!-- Issues -->
        <div class="mb-3 flex items-center justify-between sm:mb-4">
          <h2 class="text-base font-medium text-gray-900 sm:text-lg">Issues</h2>
          <button
            type="button"
            (click)="openIssueDialog()"
            class="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            New Issue
          </button>
        </div>

        @if (issues().length === 0) {
          <app-card>
            <app-empty-state title="No issues yet" description="Create your first issue for this project.">
              <button
                type="button"
                (click)="openIssueDialog()"
                class="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Create Issue
              </button>
            </app-empty-state>
          </app-card>
        } @else {
          <!-- Search, Sort, Filter -->
          <div class="mb-3 space-y-3 sm:mb-4">
            <div class="relative">
              <input
                type="text"
                placeholder="Search issues..."
                [value]="issueSearchQuery()"
                (input)="onIssueSearchChange($event)"
                class="block w-full rounded-md border border-gray-300 py-2.5 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <svg class="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div class="grid grid-cols-3 gap-2 sm:flex sm:gap-2">
              <select
                [value]="issueFilterStatus()"
                (change)="onIssueFilterStatusChange($event)"
                class="w-full rounded-md border border-gray-300 py-2.5 pl-2 pr-6 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-auto sm:pl-3 sm:pr-8 sm:text-sm"
              >
                <option value="all">Status</option>
                <option value="todo">To Do</option>
                <option value="in-progress">Progress</option>
                <option value="done">Done</option>
              </select>
              <select
                [value]="issueFilterPriority()"
                (change)="onIssueFilterPriorityChange($event)"
                class="w-full rounded-md border border-gray-300 py-2.5 pl-2 pr-6 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-auto sm:pl-3 sm:pr-8 sm:text-sm"
              >
                <option value="all">Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                [value]="issueSortBy()"
                (change)="onIssueSortChange($event)"
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
            <app-card>
              <app-empty-state
                title="No matching issues"
                description="Try adjusting your search or filter criteria."
              />
            </app-card>
          } @else {
            <div class="space-y-2 sm:space-y-3">
              @for (issue of filteredIssues(); track issue.id) {
              <div class="rounded-lg bg-white p-3 shadow hover:shadow-md sm:p-4">
                <div class="flex items-start justify-between gap-2">
                  <a [routerLink]="['/admin/issues', issue.id]" class="min-w-0 flex-1">
                    <h3 class="truncate text-sm font-medium text-gray-900 hover:text-blue-600 sm:text-base">{{ issue.title }}</h3>
                    @if (issue.description) {
                      <p class="mt-1 line-clamp-1 text-xs text-gray-500 sm:text-sm">{{ issue.description }}</p>
                    }
                  </a>
                  <div class="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
                    <app-priority-badge [priority]="issue.priority" />
                    <select
                      [value]="issue.status"
                      (change)="onQuickStatusChange(issue.id, $event)"
                      (click)="$event.stopPropagation()"
                      class="rounded-full border-0 py-0.5 pl-2 pr-6 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 sm:pr-7"
                      [class]="getStatusSelectClass(issue.status)"
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>
              </div>
            }
            </div>
          }
        }

        <!-- Issue Dialog -->
        <app-dialog [open]="issueDialogOpen()" title="New Issue" (close)="closeIssueDialog()">
          <form [formGroup]="issueForm" (ngSubmit)="onIssueSubmit()">
            <div class="space-y-4">
              <div>
                <label for="title" class="mb-1 block text-sm font-medium text-gray-700">Title *</label>
                <input
                  type="text"
                  id="title"
                  formControlName="title"
                  class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label for="issue_description" class="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="issue_description"
                  formControlName="description"
                  rows="3"
                  class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                ></textarea>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label for="issue_status" class="mb-1 block text-sm font-medium text-gray-700">Status</label>
                  <select
                    id="issue_status"
                    formControlName="status"
                    class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label for="priority" class="mb-1 block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    id="priority"
                    formControlName="priority"
                    class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label for="due_date" class="mb-1 block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  type="date"
                  id="due_date"
                  formControlName="due_date"
                  class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <button
                type="button"
                (click)="closeIssueDialog()"
                class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="savingIssue() || issueForm.invalid"
                class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {{ savingIssue() ? 'Creating...' : 'Create Issue' }}
              </button>
            </div>
          </form>
        </app-dialog>
      }
    </div>
  `,
})
export class ProjectDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly issueService = inject(IssueService);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(true);
  protected readonly project = signal<Project | null>(null);
  protected readonly issues = signal<Issue[]>([]);
  protected readonly copied = signal(false);
  protected readonly issueDialogOpen = signal(false);
  protected readonly savingIssue = signal(false);

  // Search, sort, filter for issues
  protected readonly issueSearchQuery = signal('');
  protected readonly issueSortBy = signal<IssueSortOption>('updated');
  protected readonly issueFilterStatus = signal<IssueStatus | 'all'>('all');
  protected readonly issueFilterPriority = signal<IssuePriority | 'all'>('all');

  protected readonly filteredIssues = computed(() => {
    let result = this.issues();

    // Filter by status
    const status = this.issueFilterStatus();
    if (status !== 'all') {
      result = result.filter((i) => i.status === status);
    }

    // Filter by priority
    const priority = this.issueFilterPriority();
    if (priority !== 'all') {
      result = result.filter((i) => i.priority === priority);
    }

    // Search
    const query = this.issueSearchQuery().toLowerCase().trim();
    if (query) {
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(query) ||
          i.description?.toLowerCase().includes(query)
      );
    }

    // Sort
    const sort = this.issueSortBy();
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

  protected readonly issueForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    status: ['todo' as IssueStatus],
    priority: ['medium' as IssuePriority],
    due_date: [''],
  });

  private projectId = '';

  ngOnInit(): void {
    this.projectId = this.route.snapshot.params['id'];
    this.loadData();
  }

  protected onIssueSearchChange(event: Event): void {
    this.issueSearchQuery.set((event.target as HTMLInputElement).value);
  }

  protected onIssueSortChange(event: Event): void {
    this.issueSortBy.set((event.target as HTMLSelectElement).value as IssueSortOption);
  }

  protected onIssueFilterStatusChange(event: Event): void {
    this.issueFilterStatus.set((event.target as HTMLSelectElement).value as IssueStatus | 'all');
  }

  protected onIssueFilterPriorityChange(event: Event): void {
    this.issueFilterPriority.set((event.target as HTMLSelectElement).value as IssuePriority | 'all');
  }

  protected onQuickStatusChange(issueId: string, event: Event): void {
    const newStatus = (event.target as HTMLSelectElement).value as IssueStatus;
    this.issueService.update(issueId, { status: newStatus }).subscribe({
      next: () => {
        this.issues.update((issues) =>
          issues.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i))
        );
      },
    });
  }

  protected getStatusSelectClass(status: IssueStatus): string {
    const classes: Record<IssueStatus, string> = {
      todo: 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      done: 'bg-green-100 text-green-800',
    };
    return classes[status];
  }

  protected copyShareLink(): void {
    const project = this.project();
    if (!project) return;

    const url = `${window.location.origin}/share/${project.share_token}`;
    navigator.clipboard.writeText(url).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  protected deleteProject(): void {
    if (!confirm('Are you sure you want to delete this project?')) return;

    this.projectService.delete(this.projectId).subscribe({
      next: () => {
        this.router.navigate(['/admin/projects']);
      },
    });
  }

  protected openIssueDialog(): void {
    this.issueForm.reset({ status: 'todo', priority: 'medium' });
    this.issueDialogOpen.set(true);
  }

  protected closeIssueDialog(): void {
    this.issueDialogOpen.set(false);
    this.issueForm.reset();
  }

  protected onIssueSubmit(): void {
    if (this.issueForm.invalid) return;

    this.savingIssue.set(true);
    const data = this.issueForm.getRawValue() as CreateIssueDto;

    this.issueService.create(this.projectId, data).subscribe({
      next: () => {
        this.savingIssue.set(false);
        this.closeIssueDialog();
        this.loadIssues();
      },
      error: () => {
        this.savingIssue.set(false);
      },
    });
  }

  private loadData(): void {
    this.loading.set(true);
    this.projectService.getById(this.projectId).subscribe({
      next: (project) => {
        this.project.set(project);
        this.loadIssues();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/admin/projects']);
      },
    });
  }

  private loadIssues(): void {
    this.issueService.getByProject(this.projectId).subscribe({
      next: (issues) => {
        this.issues.set(issues);
      },
    });
  }
}
