/**
 * Cloudflare Pages Function — GET /api/ads
 * Reads AD_TOP_HTML and AD_160_HTML from Cloudflare Pages env vars
 * (pushed by deploy.yml secrets: parameter).
 */

export async function onRequest(context) {
  const { env } = context;
  return new Response(JSON.stringify({
    top: env.AD_TOP_HTML || '',
    sky: env.AD_160_HTML || '',
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
