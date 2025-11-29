/**
 * Shared types for Vercel serverless functions
 */

export interface VercelRequest {
  method?: string;
  body?: any;
  query?: { [key: string]: string | string[] | undefined };
  headers?: { [key: string]: string | string[] | undefined };
  url?: string;
}

export interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
  send: (data: any) => void;
  setHeader: (name: string, value: string) => void;
}

