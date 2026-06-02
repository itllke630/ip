/**
 * Cloudflare Pages Function — GET /api/ipinfo?ip=1.2.3.4
 * Proxies to IPinfo.io (avoids browser CORS block, keeps token server-side).
 * Token: set IPINFO_TOKEN in Cloudflare Pages → Settings → Environment variables.
 */

export async function onRequest(context) {
  const { request, env } = context;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const url = new URL(request.url);
  const ip = url.searchParams.get('ip');

  if (!ip) {
    return new Response(JSON.stringify({ error: 'Missing ?ip=' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const token = env.IPINFO_TOKEN || '';
  const tokenParam = token ? '?token=' + token : '';

  try {
    const res = await fetch('https://ipinfo.io/' + encodeURIComponent(ip) + tokenParam);
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
