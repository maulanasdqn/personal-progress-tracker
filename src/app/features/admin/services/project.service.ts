import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import type { Project, CreateProjectDto, UpdateProjectDto } from '../../../models';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly api = inject(ApiService);

  getAll(): Observable<Project[]> {
    return this.api.get<Project[]>('/admin/projects');
  }

  getById(id: string): Observable<Project> {
    return this.api.get<Project>(`/admin/projects/${id}`);
  }

  create(data: CreateProjectDto): Observable<Project> {
    return this.api.post<Project>('/admin/projects', data);
  }

  update(id: string, data: UpdateProjectDto): Observable<Project> {
    return this.api.put<Project>(`/admin/projects/${id}`, data);
  }

  delete(id: string): Observable<{ deleted: boolean }> {
    return this.api.delete<{ deleted: boolean }>(`/admin/projects/${id}`);
  }

  regenerateToken(id: string): Observable<Project> {
    return this.api.put<Project>(`/admin/projects/${id}/regenerate-token`, {});
  }
}
