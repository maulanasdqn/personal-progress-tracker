import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { success, badRequest, unauthorized } from '../../../lib/response';

interface ValidateRequest {
  password: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as ValidateRequest;

    if (!body.password) {
      return badRequest('Password is required');
    }

    if (body.password === context.env.ADMIN_PASSWORD) {
      return success({ valid: true });
    }

    return unauthorized('Invalid password');
  } catch {
    return badRequest('Invalid request body');
  }
};
