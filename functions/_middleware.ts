import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from './lib/types';

// CORS middleware for all API routes
export const onRequest: PagesFunction<Env> = async (context) => {
  // Handle preflight requests
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(),
    });
  }

  // Process the request
  const response = await context.next();

  // Add CORS headers to response
  const newResponse = new Response(response.body, response);
  const corsHeaders = getCorsHeaders();
  for (const [key, value] of Object.entries(corsHeaders)) {
    newResponse.headers.set(key, value);
  }

  return newResponse;
};

function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}
