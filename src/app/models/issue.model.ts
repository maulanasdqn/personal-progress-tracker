export type IssueStatus = 'todo' | 'in-progress' | 'done';
export type IssuePriority = 'low' | 'medium' | 'high';

export interface Issue {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateIssueDto {
  title: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  due_date?: string;
}

export interface UpdateIssueDto extends Partial<CreateIssueDto> {}

export interface IssueWithProgress extends Issue {
  progress: import('./progress.model').Progress[];
}
