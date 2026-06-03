# Dual-Stack IP Detection & Privacy Audit Tool

Single-file web application deployed as a Cloudflare Worker. Detects IPv4/IPv6 addresses, runs privacy audits (WebRTC leak, proxy detection, timezone/language matching, DNS leak, AbuseIPDB blacklist), and displays results in a polished UI with 11-language i18n support.

## Architecture

```
main domain  ─┐
v4 subdomain  ─┤  Cloudflare Worker (worker/index.js)
v6 subdomain  ─┘    │
                     ├── /api/ip          → Geo data from request.cf
                     ├── /api/ipinfo      → Proxy to IPinfo.io
                     ├── /api/abuseipdb   → Proxy to AbuseIPDB
                     └── /*               → Static index.html (public/)
```

## File Structure

```
├── index.html                  # Main UI (also copied to public/)
├── public/
│   └── index.html              # Served by Worker (keep in sync with root)
├── worker/
│   └── index.js                # Worker entry point (API routes + static serving)
├── wrangler.toml               # Worker configuration
├── package.json                # Dev dependencies (wrangler)
├── package-lock.json
├── .gitignore
└── .github/workflows/
    └── deploy.yml              # CI deployment
```

## Quick Deploy (No Code Changes Needed)

### 1. Clone the Repository

```bash
git clone <repo-url>
cd ip
npm install
```

### 2. Set Up GitHub Secrets

Go to **GitHub Repo → Settings → Secrets & Variables → Actions** and add:

| Secret Name | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with **Workers** edit permission |
| `CLOUDFLARE_ACCOUNT_ID` | 32-character Cloudflare account ID (found in dashboard URL) |
| `IPINFO_TOKEN` | IPinfo.io API token (for reverse hostname lookup) |
| `ABUSEIPDB_TOKEN` | AbuseIPDB API token (for abuse confidence score) |

### 3. Set Up Cloudflare API Token

1. Go to [Cloudflare Dashboard → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Create a token with **Account → Workers Scripts → Edit** permission
3. Copy the token to GitHub Secret `CLOUDFLARE_API_TOKEN`

### 4. Configure DNS

In Cloudflare Dashboard, add DNS records (all **proxied** / orange cloud):

| Type | Name | Target | Notes |
|---|---|---|---|
| CNAME | `@` or main subdomain | `<worker-name>.workers.dev` | Main site |
| A | `v4` | `192.0.2.1` | IPv4-only (Worker handles routing) |
| AAAA | `v6` | `100::` | IPv6-only (Worker handles routing) |

**Important**: `v4` must have **only A record** (no AAAA). `v6` must have **only AAAA record** (no A). This forces the correct IP family for dual-stack probing.

After DNS propagation, add the custom domains to the Worker:
1. Go to **Workers & Pages → your-worker → Settings → Triggers**
2. Under **Custom Domains**, add all three domains

### 5. Push to Deploy

```bash
git add .
git commit -m "Deploy"
git push origin main
```

GitHub Actions will:
1. Check Cloudflare credentials
2. Inject secrets into `wrangler.toml` via Python script
3. Deploy the Worker with `wrangler deploy`

### 6. Verify

1. **GitHub Actions tab** → `Deploy` job should be **green** ✅
2. **Configure Wrangler step log** → should show injected variable values
3. **Cloudflare Dashboard** → Workers & Pages → your-worker → Settings → Variables → variables present
4. Open your main domain → page loads with IP detection

## Local Development

```bash
# Install dependencies
npm install

# Serve locally
npx wrangler dev

# Open http://localhost:8787
```

The root `index.html` is for local editing convenience. Before deploying, sync changes to `public/index.html`:

```bash
cp index.html public/index.html
```

## Updating the UI

1. Edit `index.html` (root)
2. Test locally with `npx wrangler dev`
3. Copy to `public/`: `cp index.html public/index.html`
4. Commit and push

All CSS is Tailwind CDN, all JS is vanilla ES6. No build step required.

## Environment Variables Reference

Set via `wrangler.toml` → `[vars]` → injected by CI → read by Worker via `env.VAR_NAME`:

| Variable | Endpoint | Purpose |
|---|---|---|
| `IPINFO_TOKEN` | `/api/ipinfo` | IPinfo.io reverse lookup (hostname, company type) |
| `ABUSEIPDB_TOKEN` | `/api/abuseipdb` | AbuseIPDB confidence score |

## Features

- **Dual-stack probing**: Concurrent IPv4 + IPv6 detection with fallback to public APIs
- **Privacy audit**: WebRTC leak, proxy/VPN detection, timezone check, language match, DNT status
- **Deep audit**: IPinfo hostname + company type, AbuseIPDB blacklist score, DNS leak detection
- **Anonymity score**: 100% deductive scoring model
- **i18n**: 11 languages (EN, ZH, JA, KO, FR, DE, IT, PT, RU, TR, ZH-TW)
- **Dark mode**: Toggle with localStorage persistence
- **Leaflet map**: Geolocation with fly-to animation
- **Time comparison**: Local time vs system time with mismatch alerts

## Troubleshooting

| Issue | Check |
|---|---|
| "Unable to fetch IP data" | DNS records for v4/v6 subdomains proxied (orange cloud)? Custom domains added to Worker? |
| SSL errors on v4/v6 | SSL/TLS set to Full or Flexible in Cloudflare? |
| Deep Audit no data | `IPINFO_TOKEN` / `ABUSEIPDB_TOKEN` set in GitHub Secrets? CI deploy step successful? |
| Env vars not in Cloudflare | Check GitHub Actions log for "Configure Wrangler" step output |
| Map tiles not loading | Network blocking OSM? CartoDB fallback auto-activates |
