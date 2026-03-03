import type { D1Database } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  ADMIN_PASSWORD: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'on-hold' | 'completed' | 'cancelled';
  client_name: string | null;
  client_contact: string | null;
  budget: number | null;
  deadline: string | null;
  share_token: string;
  created_at: string;
  updated_at: string;
}

export interface Issue {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Progress {
  id: string;
  issue_id: string;
  description: string;
  completion_percentage: number;
  created_at: string;
}

export interface ProjectWithIssues extends Project {
  issues: IssueWithProgress[];
}

export interface IssueWithProgress extends Issue {
  progress: Progress[];
}

export interface DashboardStats {
  total_projects: number;
  active_projects: number;
  total_issues: number;
  completed_issues: number;
  in_progress_issues: number;
  estimated_revenue: number;
  recent_projects: Project[];
}
