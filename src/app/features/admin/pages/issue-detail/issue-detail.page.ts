import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { IssueService } from '../../services/issue.service';
import { ProgressService } from '../../services/progress.service';
import {
  LoadingSpinnerComponent,
  EmptyStateComponent,
  StatusBadgeComponent,
  PriorityBadgeComponent,
  ProgressBarComponent,
  DialogComponent,
  CardComponent,
} from '../../../../shared/components';
import type { Issue, Progress, CreateProgressDto, IssueStatus, IssuePriority } from '../../../../models';

@Component({
  selector: 'app-issue-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DatePipe,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    PriorityBadgeComponent,
    ProgressBarComponent,
    DialogComponent,
    CardComponent,
  ],
  template: `
    <div>
      @if (loading()) {
        <app-loading-spinner />
      } @else if (issue()) {
        <!-- Header -->
        <div class="mb-6">
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <a routerLink="/admin/projects" class="hover:text-gray-700">Projects</a>
            <span>/</span>
            <a [routerLink]="['/admin/projects', issue()!.project_id]" class="hover:text-gray-700">Project</a>
            <span>/</span>
            <span>{{ issue()!.title }}</span>
          </div>
          <div class="mt-2 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-gray-900">{{ issue()!.title }}</h1>
              <app-priority-badge [priority]="issue()!.priority" />
              <app-status-badge [status]="issue()!.status" />
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                (click)="openEditDialog()"
                class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                type="button"
                (click)="deleteIssue()"
                class="rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        <!-- Issue Info -->
        <app-card containerClass="mb-6">
          <div class="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <div>
              <p class="text-sm font-medium text-gray-500">Due Date</p>
              <p class="mt-1 text-sm text-gray-900">
                {{ issue()!.due_date ? (issue()!.due_date | date: 'MMM d, y') : 'Not set' }}
              </p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">Created</p>
              <p class="mt-1 text-sm text-gray-900">{{ issue()!.created_at | date: 'MMM d, y' }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">Last Updated</p>
              <p class="mt-1 text-sm text-gray-900">{{ issue()!.updated_at | date: 'MMM d, y' }}</p>
            </div>
          </div>
          @if (issue()!.description) {
            <div class="mt-4 border-t pt-4">
              <p class="text-sm font-medium text-gray-500">Description</p>
              <p class="mt-1 text-sm text-gray-900">{{ issue()!.description }}</p>
            </div>
          }
        </app-card>

        <!-- Progress -->
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-medium text-gray-900">Progress Updates</h2>
          <button
            type="button"
            (click)="openProgressDialog()"
            class="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Progress
          </button>
        </div>

        @if (progressEntries().length === 0) {
          <app-card>
            <app-empty-state title="No progress updates yet" description="Add your first progress update.">
              <button
                type="button"
                (click)="openProgressDialog()"
                class="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Add Progress
              </button>
            </app-empty-state>
          </app-card>
        } @else {
          <div class="space-y-4">
            @for (entry of progressEntries(); track entry.id) {
              <app-card>
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <app-progress-bar [percentage]="entry.completion_percentage" />
                    <p class="mt-3 text-sm text-gray-900">{{ entry.description }}</p>
                    <p class="mt-2 text-xs text-gray-500">{{ entry.created_at | date: 'MMM d, y, h:mm a' }}</p>
                  </div>
                  <button
                    type="button"
                    (click)="deleteProgress(entry)"
                    class="ml-4 text-gray-400 hover:text-red-500"
                    aria-label="Delete progress entry"
                  >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </app-card>
            }
          </div>
        }

        <!-- Edit Issue Dialog -->
        <app-dialog [open]="editDialogOpen()" title="Edit Issue" (close)="closeEditDialog()">
          <form [formGroup]="editForm" (ngSubmit)="onEditSubmit()">
            <div class="space-y-4">
              <div>
                <label for="edit_title" class="mb-1 block text-sm font-medium text-gray-700">Title *</label>
                <input
                  type="text"
                  id="edit_title"
                  formControlName="title"
                  class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label for="edit_description" class="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="edit_description"
                  formControlName="description"
                  rows="3"
                  class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                ></textarea>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="edit_status" class="mb-1 block text-sm font-medium text-gray-700">Status</label>
                  <select
                    id="edit_status"
                    formControlName="status"
                    class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label for="edit_priority" class="mb-1 block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    id="edit_priority"
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
                <label for="edit_due_date" class="mb-1 block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  type="date"
                  id="edit_due_date"
                  formControlName="due_date"
                  class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <button
                type="button"
                (click)="closeEditDialog()"
                class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="savingEdit() || editForm.invalid"
                class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {{ savingEdit() ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </app-dialog>

        <!-- Progress Dialog -->
        <app-dialog [open]="progressDialogOpen()" title="Add Progress" (close)="closeProgressDialog()">
          <form [formGroup]="progressForm" (ngSubmit)="onProgressSubmit()">
            <div class="space-y-4">
              <div>
                <label for="progress_description" class="mb-1 block text-sm font-medium text-gray-700">Description *</label>
                <textarea
                  id="progress_description"
                  formControlName="description"
                  rows="3"
                  class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="What did you accomplish?"
                ></textarea>
              </div>
              <div>
                <label for="completion" class="mb-1 block text-sm font-medium text-gray-700">
                  Completion Percentage: {{ progressForm.get('completion_percentage')?.value }}%
                </label>
                <input
                  type="range"
                  id="completion"
                  formControlName="completion_percentage"
                  min="0"
                  max="100"
                  step="5"
                  class="block w-full"
                />
              </div>
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <button
                type="button"
                (click)="closeProgressDialog()"
                class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="savingProgress() || progressForm.invalid"
                class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {{ savingProgress() ? 'Adding...' : 'Add Progress' }}
              </button>
            </div>
          </form>
        </app-dialog>
      }
    </div>
  `,
})
export class IssueDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly issueService = inject(IssueService);
  private readonly progressService = inject(ProgressService);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(true);
  protected readonly issue = signal<Issue | null>(null);
  protected readonly progressEntries = signal<Progress[]>([]);

  protected readonly editDialogOpen = signal(false);
  protected readonly savingEdit = signal(false);
  protected readonly progressDialogOpen = signal(false);
  protected readonly savingProgress = signal(false);

  protected readonly editForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    status: ['todo' as IssueStatus],
    priority: ['medium' as IssuePriority],
    due_date: [''],
  });

  protected readonly progressForm = this.fb.nonNullable.group({
    description: ['', Validators.required],
    completion_percentage: [0],
  });

  private issueId = '';

  ngOnInit(): void {
    this.issueId = this.route.snapshot.params['id'];
    this.loadData();
  }

  protected openEditDialog(): void {
    const issue = this.issue();
    if (!issue) return;

    this.editForm.patchValue({
      title: issue.title,
      description: issue.description ?? '',
      status: issue.status,
      priority: issue.priority,
      due_date: issue.due_date ?? '',
    });
    this.editDialogOpen.set(true);
  }

  protected closeEditDialog(): void {
    this.editDialogOpen.set(false);
  }

  protected onEditSubmit(): void {
    if (this.editForm.invalid) return;

    this.savingEdit.set(true);
    const data = this.editForm.getRawValue();

    this.issueService.update(this.issueId, data).subscribe({
      next: (issue) => {
        this.issue.set(issue);
        this.savingEdit.set(false);
        this.closeEditDialog();
      },
      error: () => {
        this.savingEdit.set(false);
      },
    });
  }

  protected deleteIssue(): void {
    const issue = this.issue();
    if (!issue || !confirm('Are you sure you want to delete this issue?')) return;

    this.issueService.delete(this.issueId).subscribe({
      next: () => {
        this.router.navigate(['/admin/projects', issue.project_id]);
      },
    });
  }

  protected openProgressDialog(): void {
    this.progressForm.reset({ completion_percentage: 0 });
    this.progressDialogOpen.set(true);
  }

  protected closeProgressDialog(): void {
    this.progressDialogOpen.set(false);
  }

  protected onProgressSubmit(): void {
    if (this.progressForm.invalid) return;

    this.savingProgress.set(true);
    const data = this.progressForm.getRawValue() as CreateProgressDto;

    this.progressService.create(this.issueId, data).subscribe({
      next: () => {
        this.savingProgress.set(false);
        this.closeProgressDialog();
        this.loadProgress();
      },
      error: () => {
        this.savingProgress.set(false);
      },
    });
  }

  protected deleteProgress(entry: Progress): void {
    if (!confirm('Delete this progress entry?')) return;

    this.progressService.delete(entry.id).subscribe({
      next: () => {
        this.loadProgress();
      },
    });
  }

  private loadData(): void {
    this.loading.set(true);
    this.issueService.getById(this.issueId).subscribe({
      next: (issue) => {
        this.issue.set(issue);
        this.loadProgress();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/admin/projects']);
      },
    });
  }

  private loadProgress(): void {
    this.progressService.getByIssue(this.issueId).subscribe({
      next: (entries) => {
        this.progressEntries.set(entries);
      },
    });
  }
}
