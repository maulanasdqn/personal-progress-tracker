import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { validateAuth } from '../../lib/auth';
import { unauthorized } from '../../lib/response';

// Auth middleware for admin routes (except auth/validate)
export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);

  // Skip auth for the validate endpoint
  if (url.pathname === '/api/admin/auth/validate') {
    return context.next();
  }

  // Validate authentication
  if (!validateAuth(context.request, context.env)) {
    return unauthorized('Invalid or missing authentication');
  }

  return context.next();
};
