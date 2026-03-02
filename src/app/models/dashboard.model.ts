import type { Project } from './project.model';

export interface DashboardStats {
  total_projects: number;
  active_projects: number;
  total_issues: number;
  completed_issues: number;
  in_progress_issues: number;
  recent_projects: Project[];
}
