import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
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

type SortOption = 'name' | 'updated' | 'deadline' | 'status';

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
      <div class="mb-4 flex items-center justify-between sm:mb-6">
        <h1 class="text-xl font-bold text-gray-900 sm:text-2xl">Projects</h1>
        <button
          type="button"
          (click)="openCreateDialog()"
          class="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:px-4"
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
        <!-- Search, Sort, Filter -->
        <div class="mb-4 space-y-3 sm:mb-6">
          <div class="relative">
            <input
              type="text"
              placeholder="Search projects..."
              [value]="searchQuery()"
              (input)="onSearchChange($event)"
              class="block w-full rounded-md border border-gray-300 py-2.5 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <svg class="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div class="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
            <select
              [value]="filterStatus()"
              (change)="onFilterChange($event)"
              class="w-full rounded-md border border-gray-300 py-2.5 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-auto"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              [value]="sortBy()"
              (change)="onSortChange($event)"
              class="w-full rounded-md border border-gray-300 py-2.5 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-auto"
            >
              <option value="updated">Recent</option>
              <option value="name">Name</option>
              <option value="deadline">Deadline</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        @if (filteredProjects().length === 0) {
          <app-card>
            <app-empty-state
              title="No matching projects"
              description="Try adjusting your search or filter criteria."
            />
          </app-card>
        } @else {
          <div class="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            @for (project of filteredProjects(); track project.id) {
            <a
              [routerLink]="['/admin/projects', project.id]"
              class="block rounded-lg bg-white p-4 shadow transition-shadow hover:shadow-md sm:p-6"
            >
              <div class="mb-2 flex items-start justify-between gap-2">
                <h2 class="text-base font-medium text-gray-900 sm:text-lg">{{ project.name }}</h2>
                <app-status-badge [status]="project.status" />
              </div>
              @if (project.description) {
                <p class="mb-3 line-clamp-2 text-sm text-gray-500">{{ project.description }}</p>
              }
              <div class="flex items-center justify-between text-xs text-gray-500 sm:text-sm">
                <span class="truncate">{{ project.client_name ?? 'No client' }}</span>
                <span class="ml-2 flex-shrink-0">{{ project.updated_at | date: 'MMM d' }}</span>
              </div>
            </a>
          }
          </div>
        }
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
            <div class="grid gap-4 sm:grid-cols-2">
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
            <div class="grid gap-4 sm:grid-cols-2">
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

  // Search, sort, filter
  protected readonly searchQuery = signal('');
  protected readonly sortBy = signal<SortOption>('updated');
  protected readonly filterStatus = signal<ProjectStatus | 'all'>('all');

  protected readonly filteredProjects = computed(() => {
    let result = this.projects();

    // Filter by status
    const status = this.filterStatus();
    if (status !== 'all') {
      result = result.filter((p) => p.status === status);
    }

    // Search
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.client_name?.toLowerCase().includes(query)
      );
    }

    // Sort
    const sort = this.sortBy();
    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return a.deadline.localeCompare(b.deadline);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'updated':
        default:
          return b.updated_at.localeCompare(a.updated_at);
      }
    });

    return result;
  });

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

  protected onSearchChange(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected onSortChange(event: Event): void {
    this.sortBy.set((event.target as HTMLSelectElement).value as SortOption);
  }

  protected onFilterChange(event: Event): void {
    this.filterStatus.set((event.target as HTMLSelectElement).value as ProjectStatus | 'all');
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
