/**
 * Cloudflare Pages Function — GET /api/ads
 * Returns ad codes from env vars AD_TOP_HTML and AD_160_HTML.
 */

export async function onRequest(context) {
  const { env } = context;

  const data = {
    top: env.AD_TOP_HTML || '',
    sky: env.AD_160_HTML || '',
  };

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
