import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env, Progress } from '../../../lib/types';
import { queryOne } from '../../../lib/db';
import { success, notFound, badRequest, serverError } from '../../../lib/response';

// GET /api/admin/progress/:id
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const { id } = context.params;

    const progress = await queryOne<Progress>(DB, 'SELECT * FROM progress WHERE id = ?', [id]);

    if (!progress) {
      return notFound('Progress entry not found');
    }

    return success(progress);
  } catch (e) {
    console.error('Get progress error:', e);
    return serverError('Failed to fetch progress');
  }
};

// PUT /api/admin/progress/:id
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const { id } = context.params;
    const body = (await context.request.json()) as Partial<Progress>;

    const existing = await queryOne<Progress>(DB, 'SELECT * FROM progress WHERE id = ?', [id]);
    if (!existing) {
      return notFound('Progress entry not found');
    }

    if (body.description !== undefined && !body.description.trim()) {
      return badRequest('Progress description cannot be empty');
    }

    if (body.completion_percentage !== undefined) {
      if (body.completion_percentage < 0 || body.completion_percentage > 100) {
        return badRequest('Completion percentage must be between 0 and 100');
      }
    }

    await DB.prepare(
      `UPDATE progress SET
        description = COALESCE(?, description),
        completion_percentage = COALESCE(?, completion_percentage)
      WHERE id = ?`
    )
      .bind(body.description?.trim() ?? null, body.completion_percentage ?? null, id)
      .run();

    const progress = await queryOne<Progress>(DB, 'SELECT * FROM progress WHERE id = ?', [id]);
    return success(progress);
  } catch (e) {
    console.error('Update progress error:', e);
    return serverError('Failed to update progress');
  }
};

// DELETE /api/admin/progress/:id
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const { id } = context.params;

    const existing = await queryOne<Progress>(DB, 'SELECT * FROM progress WHERE id = ?', [id]);
    if (!existing) {
      return notFound('Progress entry not found');
    }

    await DB.prepare('DELETE FROM progress WHERE id = ?').bind(id).run();

    return success({ deleted: true });
  } catch (e) {
    console.error('Delete progress error:', e);
    return serverError('Failed to delete progress');
  }
};
