/**
 * Pages Functions — API routes for linkozen.com
 *
 * Handles: /api/ads  /api/ip  /api/ipinfo  /api/abuseipdb
 *
 * Env vars (set in Pages Dashboard → Settings → Environment variables):
 *   AD_TOP_HTML, AD_160_HTML, IPINFO_TOKEN, ABUSEIPDB_TOKEN
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const route = context.params.route;

  // ── /api/ip ──────────────────────────────────────────────────
  if (route === 'ip') {
    const cf = request.cf || {};
    return json({
      ip: request.headers.get('CF-Connecting-IP') || cf.ip || null,
      country: cf.country || null,
      is_eu: cf.isEUCountry || false,
      city: cf.city || null,
      region: cf.region || null,
      latitude: cf.latitude != null ? Number(cf.latitude) : null,
      longitude: cf.longitude != null ? Number(cf.longitude) : null,
      postal_code: cf.postalCode || null,
      timezone: cf.timezone || null,
      asn: cf.asn || null,
      asOrganization: cf.asOrganization || null,
    });
  }

  // ── /api/ads ─────────────────────────────────────────────────
  if (route === 'ads') {
    return json({
      top: env.AD_TOP_HTML || '',
      sky: env.AD_160_HTML || '',
    });
  }

  // ── /api/ipinfo ──────────────────────────────────────────────
  if (route === 'ipinfo') {
    const ip = url.searchParams.get('ip');
    if (!ip) return json({ error: 'Missing ?ip=' }, 400);
    const token = env.IPINFO_TOKEN || '';
    try {
      const apiUrl = 'https://ipinfo.io/' + encodeURIComponent(ip) + (token ? '?token=' + token : '');
      const res = await fetch(apiUrl);
      return json(await res.json(), res.status);
    } catch (e) { return json({ error: e.message }, 502); }
  }

  // ── /api/abuseipdb ───────────────────────────────────────────
  if (route === 'abuseipdb') {
    const ip = url.searchParams.get('ip');
    if (!ip) return json({ error: 'Missing ?ip=' }, 400);
    const token = env.ABUSEIPDB_TOKEN || '';
    try {
      const res = await fetch(
        'https://api.abuseipdb.com/api/v2/check?ipAddress=' + encodeURIComponent(ip) + '&maxAgeInDays=90',
        { headers: { Key: token, Accept: 'application/json' } }
      );
      return json(await res.json(), res.status);
    } catch (e) { return json({ error: e.message }, 502); }
  }

  // ── Unknown API route ────────────────────────────────────────
  return json({ error: 'Not found' }, 404);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
