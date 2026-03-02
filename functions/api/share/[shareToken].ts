import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env, Project, Issue, Progress, ProjectWithIssues, IssueWithProgress } from '../../lib/types';
import { queryOne, query } from '../../lib/db';
import { success, notFound, serverError } from '../../lib/response';

// GET /api/share/:shareToken - Get project with all issues and progress (public)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const { shareToken } = context.params;

    // Find project by share token
    const project = await queryOne<Project>(
      DB,
      'SELECT * FROM projects WHERE share_token = ?',
      [shareToken]
    );

    if (!project) {
      return notFound('Project not found');
    }

    // Get all issues for this project
    const issues = await query<Issue>(
      DB,
      'SELECT * FROM issues WHERE project_id = ? ORDER BY created_at DESC',
      [project.id]
    );

    // Get all progress for all issues
    const issueIds = issues.map((i) => i.id);
    let allProgress: Progress[] = [];

    if (issueIds.length > 0) {
      const placeholders = issueIds.map(() => '?').join(',');
      allProgress = await query<Progress>(
        DB,
        `SELECT * FROM progress WHERE issue_id IN (${placeholders}) ORDER BY created_at DESC`,
        issueIds
      );
    }

    // Map progress to issues
    const issuesWithProgress: IssueWithProgress[] = issues.map((issue) => ({
      ...issue,
      progress: allProgress.filter((p) => p.issue_id === issue.id),
    }));

    // Build response
    const result: ProjectWithIssues = {
      ...project,
      issues: issuesWithProgress,
    };

    return success(result);
  } catch (e) {
    console.error('Share endpoint error:', e);
    return serverError('Failed to fetch project');
  }
};
