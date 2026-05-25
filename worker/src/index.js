const UPSTREAM_ORIGIN = "https://www.papersdaddy.com";

const BROWSER_HEADERS = {
	"User-Agent":
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
	Accept:
		"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
	"Accept-Language": "en-US,en;q=0.5",
	Referer: "https://www.papersdaddy.com/",
};

const STRIP_RESPONSE_HEADERS = new Set([
	"set-cookie",
	"cf-ray",
	"cf-cache-status",
	"server",
	"report-to",
	"nel",
	"speculation-rules",
	"alt-svc",
]);

const encoder = new TextEncoder();

function constantTimeEqual(a, b) {
	const aBuf = encoder.encode(a);
	const bBuf = encoder.encode(b);
	if (aBuf.byteLength !== bBuf.byteLength) return false;
	return crypto.subtle.timingSafeEqual(aBuf, bBuf);
}

function unauthorized() {
	return new Response("unauthorized", { status: 401 });
}

export default {
	async fetch(request, env) {
		if (!env.PROXY_SECRET) {
			return new Response("PROXY_SECRET not configured", { status: 500 });
		}

		if (request.method !== "GET" && request.method !== "HEAD") {
			return new Response("method not allowed", { status: 405 });
		}

		const auth = request.headers.get("authorization") || "";
		const bearer = /^Bearer\s+(\S+)$/i.exec(auth);
		if (!bearer || !constantTimeEqual(bearer[1], env.PROXY_SECRET)) {
			return unauthorized();
		}

		const incoming = new URL(request.url);
		const upstreamUrl = `${UPSTREAM_ORIGIN}${incoming.pathname}${incoming.search}`;

		const range = request.headers.get("range");
		const upstreamHeaders = { ...BROWSER_HEADERS };
		if (range) upstreamHeaders.Range = range;

		const upstream = await fetch(upstreamUrl, {
			method: request.method,
			headers: upstreamHeaders,
			redirect: "follow",
		});

		const out = new Headers();
		for (const [k, v] of upstream.headers) {
			if (!STRIP_RESPONSE_HEADERS.has(k.toLowerCase())) out.set(k, v);
		}

		return new Response(upstream.body, {
			status: upstream.status,
			statusText: upstream.statusText,
			headers: out,
		});
	},
};
