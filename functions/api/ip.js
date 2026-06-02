/**
 * Cloudflare Pages Function — GET /api/ip
 *
 * All three domains (ip.linkozen.com, v4.ip.linkozen.com, v6.ip.linkozen.com)
 * point to the same Pages project. DNS record type determines IP family:
 *   v4  → A     record only  → client connects over IPv4
 *   v6  → AAAA  record only  → client connects over IPv6
 *
 * request.cf is available because all custom domains are proxied (orange cloud).
 */

export async function onRequest(context) {
  const { request } = context;

  // ── CORS preflight ────────────────────────────────────────────────
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

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const cf = request.cf || {};

  const data = {
    ip:            request.headers.get('CF-Connecting-IP') || cf.ip || null,
    country:       cf.country        || null,
    is_eu:         cf.isEUCountry    || false,
    city:          cf.city           || null,
    region:        cf.region         || null,
    latitude:      cf.latitude       || null,
    longitude:     cf.longitude      || null,
    postal_code:   cf.postalCode     || null,
    timezone:      cf.timezone       || null,
    asn:           cf.asn            || null,
    asOrganization: cf.asOrganization || null,
  };

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
