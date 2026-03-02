import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ProjectService } from '../../services/project.service';
import {
  LoadingSpinnerComponent,
  EmptyStateComponent,
  StatusBadgeComponent,
  DialogComponent,
  CardComponent,
} from '../../../../shared/components';
import type { Project, CreateProjectDto, ProjectStatus } from '../../../../models';

@Component({
  selector: 'app-projects-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DatePipe,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    DialogComponent,
    CardComponent,
  ],
  template: `
    <div>
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Projects</h1>
        <button
          type="button"
          (click)="openCreateDialog()"
          class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          New Project
        </button>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (projects().length === 0) {
        <app-card>
          <app-empty-state
            title="No projects yet"
            description="Get started by creating your first project."
          >
            <button
              type="button"
              (click)="openCreateDialog()"
              class="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Create Project
            </button>
          </app-empty-state>
        </app-card>
      } @else {
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (project of projects(); track project.id) {
            <a
              [routerLink]="['/admin/projects', project.id]"
              class="block rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
            >
              <div class="mb-2 flex items-start justify-between">
                <h2 class="text-lg font-medium text-gray-900">{{ project.name }}</h2>
                <app-status-badge [status]="project.status" />
              </div>
              @if (project.description) {
                <p class="mb-3 line-clamp-2 text-sm text-gray-500">{{ project.description }}</p>
              }
              <div class="flex items-center justify-between text-sm text-gray-500">
                <span>{{ project.client_name ?? 'No client' }}</span>
                <span>{{ project.updated_at | date: 'MMM d' }}</span>
              </div>
            </a>
          }
        </div>
      }

      <!-- Create/Edit Dialog -->
      <app-dialog [open]="dialogOpen()" [title]="editingProject() ? 'Edit Project' : 'New Project'" (close)="closeDialog()">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="space-y-4">
            <div>
              <label for="name" class="mb-1 block text-sm font-medium text-gray-700">Name *</label>
              <input
                type="text"
                id="name"
                formControlName="name"
                class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label for="description" class="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                formControlName="description"
                rows="3"
                class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              ></textarea>
            </div>
            <div>
              <label for="status" class="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select
                id="status"
                formControlName="status"
                class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="client_name" class="mb-1 block text-sm font-medium text-gray-700">Client Name</label>
                <input
                  type="text"
                  id="client_name"
                  formControlName="client_name"
                  class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label for="client_contact" class="mb-1 block text-sm font-medium text-gray-700">Client Contact</label>
                <input
                  type="text"
                  id="client_contact"
                  formControlName="client_contact"
                  class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="budget" class="mb-1 block text-sm font-medium text-gray-700">Budget</label>
                <input
                  type="number"
                  id="budget"
                  formControlName="budget"
                  class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label for="deadline" class="mb-1 block text-sm font-medium text-gray-700">Deadline</label>
                <input
                  type="date"
                  id="deadline"
                  formControlName="deadline"
                  class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              (click)="closeDialog()"
              class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="saving() || form.invalid"
              class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {{ saving() ? 'Saving...' : editingProject() ? 'Save Changes' : 'Create Project' }}
            </button>
          </div>
        </form>
      </app-dialog>
    </div>
  `,
})
export class ProjectsPage implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly projects = signal<Project[]>([]);
  protected readonly dialogOpen = signal(false);
  protected readonly editingProject = signal<Project | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    status: ['active' as ProjectStatus],
    client_name: [''],
    client_contact: [''],
    budget: [null as number | null],
    deadline: [''],
  });

  ngOnInit(): void {
    this.loadProjects();
  }

  protected openCreateDialog(): void {
    this.editingProject.set(null);
    this.form.reset({ status: 'active' });
    this.dialogOpen.set(true);
  }

  protected closeDialog(): void {
    this.dialogOpen.set(false);
    this.editingProject.set(null);
    this.form.reset();
  }

  protected onSubmit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const data = this.form.getRawValue() as CreateProjectDto;

    const editing = this.editingProject();
    const request = editing
      ? this.projectService.update(editing.id, data)
      : this.projectService.create(data);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeDialog();
        this.loadProjects();
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  private loadProjects(): void {
    this.loading.set(true);
    this.projectService.getAll().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
