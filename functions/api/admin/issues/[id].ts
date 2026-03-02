import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env, Issue } from '../../../lib/types';
import { queryOne, nowISO } from '../../../lib/db';
import { success, notFound, badRequest, serverError } from '../../../lib/response';

// GET /api/admin/issues/:id
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const { id } = context.params;

    const issue = await queryOne<Issue>(DB, 'SELECT * FROM issues WHERE id = ?', [id]);

    if (!issue) {
      return notFound('Issue not found');
    }

    return success(issue);
  } catch (e) {
    console.error('Get issue error:', e);
    return serverError('Failed to fetch issue');
  }
};

// PUT /api/admin/issues/:id
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const { id } = context.params;
    const body = (await context.request.json()) as Partial<Issue>;

    const existing = await queryOne<Issue>(DB, 'SELECT * FROM issues WHERE id = ?', [id]);
    if (!existing) {
      return notFound('Issue not found');
    }

    if (body.title !== undefined && !body.title.trim()) {
      return badRequest('Issue title cannot be empty');
    }

    const now = nowISO();

    await DB.prepare(
      `UPDATE issues SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        due_date = COALESCE(?, due_date),
        updated_at = ?
      WHERE id = ?`
    )
      .bind(
        body.title?.trim() ?? null,
        body.description ?? null,
        body.status ?? null,
        body.priority ?? null,
        body.due_date ?? null,
        now,
        id
      )
      .run();

    const issue = await queryOne<Issue>(DB, 'SELECT * FROM issues WHERE id = ?', [id]);
    return success(issue);
  } catch (e) {
    console.error('Update issue error:', e);
    return serverError('Failed to update issue');
  }
};

// DELETE /api/admin/issues/:id
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const { id } = context.params;

    const existing = await queryOne<Issue>(DB, 'SELECT * FROM issues WHERE id = ?', [id]);
    if (!existing) {
      return notFound('Issue not found');
    }

    // Delete issue (cascade will delete progress)
    await DB.prepare('DELETE FROM issues WHERE id = ?').bind(id).run();

    return success({ deleted: true });
  } catch (e) {
    console.error('Delete issue error:', e);
    return serverError('Failed to delete issue');
  }
};
