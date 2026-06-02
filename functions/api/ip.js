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

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

export async function onRequest(context) {
  const { request } = context;

  // ── CORS preflight ────────────────────────────────────────────────
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const cf = request.cf || {};
  const host = (request.headers.get('Host') || '').toLowerCase();
  const clientIP = request.headers.get('CF-Connecting-IP') || cf.ip || '';

  // ── IPv6 protocol enforcement ─────────────────────────────────────
  // If the request arrived via the v6 subdomain but the client IP is
  // IPv4, the network doesn't have a working IPv6 route.  Signal this
  // so the frontend can show "Not Available" instead of a bogus IP.
  const isV6 = host.startsWith('v6.');
  const isV4 = host.startsWith('v4.');
  const isIPv6Addr = clientIP.indexOf(':') !== -1;

  if (isV6 && clientIP && !isIPv6Addr) {
    return new Response(JSON.stringify({
      ip: null,
      ipv6_unsupported: true,
      _hint: 'Network does not support IPv6 — client connected over IPv4',
    }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // ── Build response ────────────────────────────────────────────────
  const data = {
    ip:            clientIP || null,
    country:       cf.country        || null,
    is_eu:         cf.isEUCountry    || false,
    city:          cf.city           || null,
    region:        cf.region         || null,
    latitude:      cf.latitude != null ? Number(cf.latitude) : null,
    longitude:     cf.longitude != null ? Number(cf.longitude) : null,
    postal_code:   cf.postalCode     || null,
    timezone:      cf.timezone       || null,
    asn:           cf.asn            || null,
    asOrganization: cf.asOrganization || null,
  };

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
