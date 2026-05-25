# snapaper-papersdaddy-proxy

Cloudflare Worker that proxies `https://www.papersdaddy.com` so the Snapaper Fly.io app can fetch upstream paper pages and PDF streams without tripping Cloudflare's datacenter-IP rate limiter on Fly's egress.

The worker is a thin pass-through: it spoofs a desktop browser `User-Agent`, requires `Authorization: Bearer <PROXY_SECRET>`, and streams responses verbatim. All routing, slug logic, and HTML parsing stays in the Node.js backend.

## Deploy

```bash
pnpm install
pnpm wrangler secret put PROXY_SECRET   # paste a long random string
pnpm deploy
```

Then set the same secret on Snapaper:

```bash
fly secrets set PROXY_BASE=https://snapaper-papersdaddy-proxy.<subdomain>.workers.dev PROXY_SECRET=<same string>
```
