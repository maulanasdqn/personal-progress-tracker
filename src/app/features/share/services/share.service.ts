import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { SharedProject, ApiResponse } from '../../../models';

@Injectable({ providedIn: 'root' })
export class ShareService {
  private readonly http = inject(HttpClient);

  getProject(shareToken: string): Observable<SharedProject> {
    return this.http.get<ApiResponse<SharedProject>>(`/api/share/${shareToken}`).pipe(
      map((response) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error?.message ?? 'Project not found');
      })
    );
  }
}
