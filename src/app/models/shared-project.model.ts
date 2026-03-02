import type { Project } from './project.model';
import type { IssueWithProgress } from './issue.model';

export interface SharedProject extends Project {
  issues: IssueWithProgress[];
}
