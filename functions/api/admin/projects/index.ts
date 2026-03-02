import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env, Project } from '../../../lib/types';
import { query, queryOne, generateId, generateShareToken, nowISO } from '../../../lib/db';
import { success, badRequest, serverError } from '../../../lib/response';

// GET /api/admin/projects - List all projects
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const projects = await query<Project>(
      DB,
      'SELECT * FROM projects ORDER BY updated_at DESC'
    );
    return success(projects);
  } catch (e) {
    console.error('List projects error:', e);
    return serverError('Failed to fetch projects');
  }
};

// POST /api/admin/projects - Create a new project
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const body = (await context.request.json()) as Partial<Project>;

    if (!body.name?.trim()) {
      return badRequest('Project name is required');
    }

    const id = generateId();
    const shareToken = generateShareToken();
    const now = nowISO();

    await DB.prepare(
      `INSERT INTO projects (id, name, description, status, client_name, client_contact, budget, deadline, share_token, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        body.name.trim(),
        body.description ?? null,
        body.status ?? 'active',
        body.client_name ?? null,
        body.client_contact ?? null,
        body.budget ?? null,
        body.deadline ?? null,
        shareToken,
        now,
        now
      )
      .run();

    const project = await queryOne<Project>(DB, 'SELECT * FROM projects WHERE id = ?', [id]);
    return success(project, 201);
  } catch (e) {
    console.error('Create project error:', e);
    return serverError('Failed to create project');
  }
};
