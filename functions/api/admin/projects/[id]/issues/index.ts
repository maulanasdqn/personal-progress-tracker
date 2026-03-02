import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env, Issue, Project } from '../../../../../lib/types';
import { query, queryOne, generateId, nowISO } from '../../../../../lib/db';
import { success, notFound, badRequest, serverError } from '../../../../../lib/response';

// GET /api/admin/projects/:id/issues
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const { id } = context.params;

    // Verify project exists
    const project = await queryOne<Project>(DB, 'SELECT id FROM projects WHERE id = ?', [id]);
    if (!project) {
      return notFound('Project not found');
    }

    const issues = await query<Issue>(
      DB,
      'SELECT * FROM issues WHERE project_id = ? ORDER BY created_at DESC',
      [id]
    );

    return success(issues);
  } catch (e) {
    console.error('List issues error:', e);
    return serverError('Failed to fetch issues');
  }
};

// POST /api/admin/projects/:id/issues
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const { id: projectId } = context.params;
    const body = (await context.request.json()) as Partial<Issue>;

    // Verify project exists
    const project = await queryOne<Project>(DB, 'SELECT id FROM projects WHERE id = ?', [
      projectId,
    ]);
    if (!project) {
      return notFound('Project not found');
    }

    if (!body.title?.trim()) {
      return badRequest('Issue title is required');
    }

    const id = generateId();
    const now = nowISO();

    await DB.prepare(
      `INSERT INTO issues (id, project_id, title, description, status, priority, due_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        projectId,
        body.title.trim(),
        body.description ?? null,
        body.status ?? 'todo',
        body.priority ?? 'medium',
        body.due_date ?? null,
        now,
        now
      )
      .run();

    const issue = await queryOne<Issue>(DB, 'SELECT * FROM issues WHERE id = ?', [id]);
    return success(issue, 201);
  } catch (e) {
    console.error('Create issue error:', e);
    return serverError('Failed to create issue');
  }
};
