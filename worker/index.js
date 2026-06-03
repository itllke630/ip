/**
 * Cloudflare Worker — linkozen.com
 *
 * Deployed on:
 *   www.linkozen.com  — full site (static + all API routes)
 *   v4.linkozen.com   — IPv4-only  endpoint (/api/ip)
 *   v6.linkozen.com   — IPv6-only  endpoint (/api/ip)
 *
 * Dual-stack detection relies on separate hostnames with different DNS:
 *   v4.linkozen.com → A record only (no AAAA)
 *   v6.linkozen.com → AAAA record only (no A)
 *
 * Vars from wrangler.toml [vars].
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ── API: /api/ip ───────────────────────────────────────────
    if (path === '/api/ip') {
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

    // ── API: /api/ads ──────────────────────────────────────────
    if (path === '/api/ads') {
      return json({
        top: env.AD_TOP_HTML || '',
        sky: env.AD_160_HTML || '',
      });
    }

    // ── API: /api/ipinfo ───────────────────────────────────────
    if (path === '/api/ipinfo') {
      const ip = url.searchParams.get('ip');
      if (!ip) return json({ error: 'Missing ?ip=' }, 400);
      const token = env.IPINFO_TOKEN || '';
      try {
        const apiUrl = 'https://ipinfo.io/' + encodeURIComponent(ip) + (token ? '?token=' + token : '');
        const res = await fetch(apiUrl);
        return json(await res.json(), res.status);
      } catch (e) { return json({ error: e.message }, 502); }
    }

    // ── API: /api/abuseipdb ────────────────────────────────────
    if (path === '/api/abuseipdb') {
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

    // ── Static: serve index.html (hub) / ip.html & other pages ─
    return env.ASSETS.fetch(request);
  },
};

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
