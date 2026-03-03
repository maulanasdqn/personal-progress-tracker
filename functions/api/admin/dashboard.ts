import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env, Project, DashboardStats } from '../../lib/types';
import { query } from '../../lib/db';
import { success, serverError } from '../../lib/response';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    // Get project counts and estimated revenue
    const projectStats = await query<{ total: number; active: number; estimated_revenue: number }>(
      DB,
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        COALESCE(SUM(CASE WHEN status = 'active' THEN budget ELSE 0 END), 0) as estimated_revenue
      FROM projects`
    );

    // Get issue counts
    const issueStats = await query<{
      total: number;
      completed: number;
      in_progress: number;
    }>(
      DB,
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress
      FROM issues`
    );

    // Get recent projects
    const recentProjects = await query<Project>(
      DB,
      `SELECT * FROM projects ORDER BY updated_at DESC LIMIT 5`
    );

    const stats: DashboardStats = {
      total_projects: projectStats[0]?.total ?? 0,
      active_projects: projectStats[0]?.active ?? 0,
      total_issues: issueStats[0]?.total ?? 0,
      completed_issues: issueStats[0]?.completed ?? 0,
      in_progress_issues: issueStats[0]?.in_progress ?? 0,
      estimated_revenue: projectStats[0]?.estimated_revenue ?? 0,
      recent_projects: recentProjects,
    };

    return success(stats);
  } catch (e) {
    console.error('Dashboard error:', e);
    return serverError('Failed to fetch dashboard stats');
  }
};
