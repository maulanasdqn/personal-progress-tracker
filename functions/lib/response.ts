export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export function success<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data } satisfies ApiResponse<T>, {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function error(code: string, message: string, status = 400): Response {
  return Response.json(
    { success: false, error: { code, message } } satisfies ApiResponse<never>,
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}

export function notFound(message = 'Resource not found'): Response {
  return error('NOT_FOUND', message, 404);
}

export function unauthorized(message = 'Unauthorized'): Response {
  return error('UNAUTHORIZED', message, 401);
}

export function badRequest(message: string): Response {
  return error('BAD_REQUEST', message, 400);
}

export function serverError(message = 'Internal server error'): Response {
  return error('SERVER_ERROR', message, 500);
}
