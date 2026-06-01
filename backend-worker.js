/**
 * backend-worker.js — Cloudflare Worker
 *
 * Deploy via `npx wrangler deploy` or copy-paste into the Cloudflare Dashboard.
 *
 * DNS setup required:
 *   v4.ip.linkozen.com  →  A     record only (no AAAA), proxied (orange cloud)
 *   v6.ip.linkozen.com  →  AAAA  record only (no A),     proxied (orange cloud)
 *
 * Both hostnames route to this single Worker. The DNS record type ensures
 * clients connect over the desired IP family; the Worker just echoes back
 * whatever request.cf reports.
 */

export default {
  async fetch(request, env, ctx) {
    // ── CORS Preflight ────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // ── Method Guard ──────────────────────────────────────────────────
    if (request.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method Not Allowed' }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // ── Read Cloudflare metadata ─────────────────────────────────────
    // request.cf is only populated when the hostname is proxied (orange-cloud).
    // Fall back to headers / empty values when unavailable.
    const cf = request.cf || {};

    const data = {
      ip:            request.headers.get('CF-Connecting-IP') || cf.ip || null,
      country:       cf.country        || null,
      is_eu:         cf.isEUCountry    || null,
      city:          cf.city           || null,
      region:        cf.region         || null,
      latitude:      cf.latitude       || null,
      longitude:     cf.longitude      || null,
      postal_code:   cf.postalCode     || null,
      timezone:      cf.timezone       || null,
      asn:           cf.asn            || null,
      asOrganization: cf.asOrganization || null,
    };

    return new Response(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  },
};
