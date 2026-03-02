import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env, Project } from '../../../../lib/types';
import { queryOne, generateShareToken, nowISO } from '../../../../lib/db';
import { success, notFound, serverError } from '../../../../lib/response';

// PUT /api/admin/projects/:id/regenerate-token
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const { id } = context.params;

    const existing = await queryOne<Project>(DB, 'SELECT * FROM projects WHERE id = ?', [id]);
    if (!existing) {
      return notFound('Project not found');
    }

    const newToken = generateShareToken();
    const now = nowISO();

    await DB.prepare('UPDATE projects SET share_token = ?, updated_at = ? WHERE id = ?')
      .bind(newToken, now, id)
      .run();

    const project = await queryOne<Project>(DB, 'SELECT * FROM projects WHERE id = ?', [id]);
    return success(project);
  } catch (e) {
    console.error('Regenerate token error:', e);
    return serverError('Failed to regenerate share token');
  }
};
