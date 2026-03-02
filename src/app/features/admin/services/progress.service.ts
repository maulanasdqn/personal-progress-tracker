import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import type { Progress, CreateProgressDto, UpdateProgressDto } from '../../../models';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly api = inject(ApiService);

  getByIssue(issueId: string): Observable<Progress[]> {
    return this.api.get<Progress[]>(`/admin/issues/${issueId}/progress`);
  }

  getById(id: string): Observable<Progress> {
    return this.api.get<Progress>(`/admin/progress/${id}`);
  }

  create(issueId: string, data: CreateProgressDto): Observable<Progress> {
    return this.api.post<Progress>(`/admin/issues/${issueId}/progress`, data);
  }

  update(id: string, data: UpdateProgressDto): Observable<Progress> {
    return this.api.put<Progress>(`/admin/progress/${id}`, data);
  }

  delete(id: string): Observable<{ deleted: boolean }> {
    return this.api.delete<{ deleted: boolean }>(`/admin/progress/${id}`);
  }
}
