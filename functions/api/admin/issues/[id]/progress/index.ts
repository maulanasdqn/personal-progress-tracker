import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env, Progress, Issue } from '../../../../../lib/types';
import { query, queryOne, generateId, nowISO } from '../../../../../lib/db';
import { success, notFound, badRequest, serverError } from '../../../../../lib/response';

// GET /api/admin/issues/:id/progress
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const { id } = context.params;

    // Verify issue exists
    const issue = await queryOne<Issue>(DB, 'SELECT id FROM issues WHERE id = ?', [id]);
    if (!issue) {
      return notFound('Issue not found');
    }

    const progress = await query<Progress>(
      DB,
      'SELECT * FROM progress WHERE issue_id = ? ORDER BY created_at DESC',
      [id]
    );

    return success(progress);
  } catch (e) {
    console.error('List progress error:', e);
    return serverError('Failed to fetch progress');
  }
};

// POST /api/admin/issues/:id/progress
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const { id: issueId } = context.params;
    const body = (await context.request.json()) as Partial<Progress>;

    // Verify issue exists
    const issue = await queryOne<Issue>(DB, 'SELECT id FROM issues WHERE id = ?', [issueId]);
    if (!issue) {
      return notFound('Issue not found');
    }

    if (!body.description?.trim()) {
      return badRequest('Progress description is required');
    }

    const percentage = body.completion_percentage ?? 0;
    if (percentage < 0 || percentage > 100) {
      return badRequest('Completion percentage must be between 0 and 100');
    }

    const id = generateId();
    const now = nowISO();

    await DB.prepare(
      `INSERT INTO progress (id, issue_id, description, completion_percentage, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(id, issueId, body.description.trim(), percentage, now)
      .run();

    const progress = await queryOne<Progress>(DB, 'SELECT * FROM progress WHERE id = ?', [id]);
    return success(progress, 201);
  } catch (e) {
    console.error('Create progress error:', e);
    return serverError('Failed to create progress');
  }
};
