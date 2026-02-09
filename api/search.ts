/**
 * GET /api/search
 * Global search across measurements, customers, and orders
 */

// Vercel serverless function types
interface VercelRequest {
  method?: string;
  body?: any;
  query?: any;
  headers?: any;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
}

import { query } from '../src/utils/db';
import { requireAuth } from '../src/utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    const r = res as any;
    if (r.setHeader) {
      r.setHeader('Access-Control-Allow-Origin', req.headers?.origin || '*');
      r.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      r.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      r.setHeader('Access-Control-Max-Age', '86400');
    }
    return res.status(200).json({});
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = requireAuth(req);
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json({ results: [] });
    }

    const searchTerm = `%${q}%`;
    const results: any[] = [];

    // Search measurements
    const measurements = await query<any>(
      `SELECT 
        m.id,
        m.entry_id,
        c.name as customer_name,
        c.phone as customer_phone,
        'measurement' as type
       FROM measurements m
       LEFT JOIN customers c ON m.customer_id = c.id
       WHERE m.entry_id ILIKE $1 
          OR c.name ILIKE $1 
          OR c.phone ILIKE $1
       LIMIT 10`,
      [searchTerm]
    );

    measurements.forEach((m) => {
      results.push({
        type: 'measurement',
        id: m.id,
        title: m.customer_name || 'Unknown Customer',
        subtitle: `Entry ID: ${m.entry_id} | Phone: ${m.customer_phone || 'N/A'}`,
        link: `/measurements/${m.id}`,
      });
    });

    // Search customers
    const customers = await query<any>(
      `SELECT id, name, phone, email
       FROM customers
       WHERE name ILIKE $1 
          OR phone ILIKE $1 
          OR email ILIKE $1
       LIMIT 10`,
      [searchTerm]
    );

    customers.forEach((c) => {
      results.push({
        type: 'customer',
        id: c.id,
        title: c.name,
        subtitle: `Phone: ${c.phone || 'N/A'} | Email: ${c.email || 'N/A'}`,
        link: `/customers/${c.id}`,
      });
    });

    // Search orders (if exists)
    const orders = await query<any>(
      `SELECT o.id, o.status, c.name as customer_name
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.id::text ILIKE $1 
          OR c.name ILIKE $1
       LIMIT 10`,
      [searchTerm]
    );

    orders.forEach((o) => {
      results.push({
        type: 'order',
        id: o.id,
        title: `Order ${o.id.substring(0, 8)}`,
        subtitle: `Customer: ${o.customer_name || 'N/A'} | Status: ${o.status}`,
        link: `/orders/${o.id}`,
      });
    });

    return res.status(200).json({ results: results.slice(0, 20) });
  } catch (error: any) {
    console.error('Search error:', error);
    if (error.message === 'Authentication required') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

