import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env, Project } from '../../../lib/types';
import { queryOne, nowISO } from '../../../lib/db';
import { success, notFound, badRequest, serverError } from '../../../lib/response';

// GET /api/admin/projects/:id
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const { id } = context.params;

    const project = await queryOne<Project>(DB, 'SELECT * FROM projects WHERE id = ?', [id]);

    if (!project) {
      return notFound('Project not found');
    }

    return success(project);
  } catch (e) {
    console.error('Get project error:', e);
    return serverError('Failed to fetch project');
  }
};

// PUT /api/admin/projects/:id
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const { id } = context.params;
    const body = (await context.request.json()) as Partial<Project>;

    const existing = await queryOne<Project>(DB, 'SELECT * FROM projects WHERE id = ?', [id]);
    if (!existing) {
      return notFound('Project not found');
    }

    if (body.name !== undefined && !body.name.trim()) {
      return badRequest('Project name cannot be empty');
    }

    const now = nowISO();

    await DB.prepare(
      `UPDATE projects SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        client_name = COALESCE(?, client_name),
        client_contact = COALESCE(?, client_contact),
        budget = COALESCE(?, budget),
        deadline = COALESCE(?, deadline),
        updated_at = ?
      WHERE id = ?`
    )
      .bind(
        body.name?.trim() ?? null,
        body.description ?? null,
        body.status ?? null,
        body.client_name ?? null,
        body.client_contact ?? null,
        body.budget ?? null,
        body.deadline ?? null,
        now,
        id
      )
      .run();

    const project = await queryOne<Project>(DB, 'SELECT * FROM projects WHERE id = ?', [id]);
    return success(project);
  } catch (e) {
    console.error('Update project error:', e);
    return serverError('Failed to update project');
  }
};

// DELETE /api/admin/projects/:id
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const { id } = context.params;

    const existing = await queryOne<Project>(DB, 'SELECT * FROM projects WHERE id = ?', [id]);
    if (!existing) {
      return notFound('Project not found');
    }

    // Delete project (cascade will delete issues and progress)
    await DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();

    return success({ deleted: true });
  } catch (e) {
    console.error('Delete project error:', e);
    return serverError('Failed to delete project');
  }
};
