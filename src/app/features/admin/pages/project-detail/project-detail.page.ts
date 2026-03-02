import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ProjectService } from '../../services/project.service';
import { IssueService } from '../../services/issue.service';
import {
  LoadingSpinnerComponent,
  EmptyStateComponent,
  StatusBadgeComponent,
  PriorityBadgeComponent,
  DialogComponent,
  CardComponent,
} from '../../../../shared/components';
import type { Project, Issue, CreateIssueDto, IssueStatus, IssuePriority } from '../../../../models';

@Component({
  selector: 'app-project-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DatePipe,
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
        <div class="mb-6">
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <a routerLink="/admin/projects" class="hover:text-gray-700">Projects</a>
            <span>/</span>
            <span>{{ project()!.name }}</span>
          </div>
          <div class="mt-2 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-gray-900">{{ project()!.name }}</h1>
              <app-status-badge [status]="project()!.status" />
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                (click)="copyShareLink()"
                class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {{ copied() ? 'Copied!' : 'Copy Share Link' }}
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
        <app-card containerClass="mb-6">
          <div class="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div>
              <p class="text-sm font-medium text-gray-500">Client</p>
              <p class="mt-1 text-sm text-gray-900">{{ project()!.client_name ?? 'Not set' }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">Contact</p>
              <p class="mt-1 text-sm text-gray-900">{{ project()!.client_contact ?? 'Not set' }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">Budget</p>
              <p class="mt-1 text-sm text-gray-900">
                {{ project()!.budget ? '$' + project()!.budget : 'Not set' }}
              </p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">Deadline</p>
              <p class="mt-1 text-sm text-gray-900">
                {{ project()!.deadline ? (project()!.deadline | date: 'MMM d, y') : 'Not set' }}
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

        <!-- Issues -->
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-medium text-gray-900">Issues</h2>
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
          <div class="space-y-3">
            @for (issue of issues(); track issue.id) {
              <a
                [routerLink]="['/admin/issues', issue.id]"
                class="flex items-center justify-between rounded-lg bg-white p-4 shadow hover:shadow-md"
              >
                <div>
                  <h3 class="font-medium text-gray-900">{{ issue.title }}</h3>
                  @if (issue.description) {
                    <p class="mt-1 line-clamp-1 text-sm text-gray-500">{{ issue.description }}</p>
                  }
                </div>
                <div class="flex items-center gap-3">
                  <app-priority-badge [priority]="issue.priority" />
                  <app-status-badge [status]="issue.status" />
                </div>
              </a>
            }
          </div>
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
              <div class="grid grid-cols-2 gap-4">
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
