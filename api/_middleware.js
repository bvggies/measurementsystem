/**
 * Vercel middleware to add cache-control headers to all API responses
 * This file should be in the api directory
 */

export default function middleware(req) {
  // Add cache-control headers to all API responses
  const response = new Response(null, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
  
  return response;
}

