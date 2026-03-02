import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import type { Issue, CreateIssueDto, UpdateIssueDto } from '../../../models';

@Injectable({ providedIn: 'root' })
export class IssueService {
  private readonly api = inject(ApiService);

  getByProject(projectId: string): Observable<Issue[]> {
    return this.api.get<Issue[]>(`/admin/projects/${projectId}/issues`);
  }

  getById(id: string): Observable<Issue> {
    return this.api.get<Issue>(`/admin/issues/${id}`);
  }

  create(projectId: string, data: CreateIssueDto): Observable<Issue> {
    return this.api.post<Issue>(`/admin/projects/${projectId}/issues`, data);
  }

  update(id: string, data: UpdateIssueDto): Observable<Issue> {
    return this.api.put<Issue>(`/admin/issues/${id}`, data);
  }

  delete(id: string): Observable<{ deleted: boolean }> {
    return this.api.delete<{ deleted: boolean }>(`/admin/issues/${id}`);
  }
}
