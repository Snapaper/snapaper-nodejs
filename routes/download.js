var express = require("express");
var https = require("https");
var router = express.Router();
var { resolveDownload } = require("../utils/papersdaddy_wrapper");
var { stripWatermark } = require("../utils/watermark_stripper");

const SAFE_PATH = /^\/cambridge\/[a-z0-9-]+\/[a-z0-9-]+\/[0-9]{4}-[a-z-]+\/[A-Za-z0-9_.-]+\.(pdf|mp3|docx?)$/;

const STREAM_HEADERS = {
	"User-Agent":
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
	Accept: "*/*",
};
if (process.env.PROXY_SECRET) {
	STREAM_HEADERS.Authorization = `Bearer ${process.env.PROXY_SECRET}`;
}

const CONTENT_TYPE_BY_EXT = {
	pdf: "application/pdf",
	mp3: "audio/mpeg",
	doc: "application/msword",
	docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

// Returns {start, end} clamped to [0, total-1] or null if the header is
// malformed/unsupported. Only handles single-range "bytes=start-end".
function parseRange(header, total) {
	const m = /^bytes=(\d*)-(\d*)$/.exec(header || "");
	if (!m) return null;
	const hasStart = m[1] !== "";
	const hasEnd = m[2] !== "";
	if (!hasStart && !hasEnd) return null;

	let start, end;
	if (!hasStart) {
		// Suffix range "bytes=-500" → last 500 bytes
		const suffix = parseInt(m[2], 10);
		if (suffix <= 0) return null;
		start = Math.max(0, total - suffix);
		end = total - 1;
	} else {
		start = parseInt(m[1], 10);
		end = hasEnd ? parseInt(m[2], 10) : total - 1;
	}
	if (start >= total || start < 0 || end < start) return null;
	end = Math.min(end, total - 1);
	return { start, end };
}

function sendBuffer(req, res, body, contentType, filename, asAttachment) {
	const total = body.length;
	res.setHeader("Content-Type", contentType);
	res.setHeader(
		"Content-Disposition",
		`${asAttachment ? "attachment" : "inline"}; filename="${filename}"`
	);
	res.setHeader("Accept-Ranges", "bytes");
	res.setHeader("Cache-Control", "public, max-age=86400");

	const range = parseRange(req.headers.range, total);
	if (range) {
		const slice = body.subarray(range.start, range.end + 1);
		res.status(206);
		res.setHeader("Content-Range", `bytes ${range.start}-${range.end}/${total}`);
		res.setHeader("Content-Length", slice.length);
		if (req.method === "HEAD") return res.end();
		return res.end(slice);
	}

	res.status(200);
	res.setHeader("Content-Length", total);
	if (req.method === "HEAD") return res.end();
	return res.end(body);
}

function handle(req, res) {
	const subpath = req.path;
	if (!SAFE_PATH.test(subpath)) {
		return res.status(400).json({ error: "invalid path", path: subpath });
	}
	const asAttachment = req.query.download === "1" || req.query.download === "true";

	resolveDownload(subpath, function (err, url) {
		if (err) {
			console.log(err);
			return res.status(502).json({ error: err.message });
		}

		const filename = subpath.split("/").pop();
		const ext = filename.split(".").pop().toLowerCase();
		const contentType = CONTENT_TYPE_BY_EXT[ext] || "application/octet-stream";

		const upstream = https.get(url, { headers: STREAM_HEADERS }, function (up) {
			if (up.statusCode !== 200) {
				res.status(502).json({ error: `upstream ${up.statusCode}` });
				up.resume();
				return;
			}

			const chunks = [];
			up.on("data", (c) => chunks.push(c));
			up.on("end", async () => {
				const raw = Buffer.concat(chunks);
				let body = raw;
				if (ext === "pdf") {
					try {
						body = await stripWatermark(raw);
					} catch (e) {
						console.log("watermark strip failed, serving original:", e.message);
					}
				}
				if (res.writableEnded || res.destroyed) return;
				sendBuffer(req, res, body, contentType, filename, asAttachment);
			});
			up.on("error", function (e) {
				console.log(e);
				if (!res.headersSent) res.status(502).json({ error: e.message });
			});
		});

		upstream.on("error", function (e) {
			console.log(e);
			if (!res.headersSent) {
				res.status(502).json({ error: e.message });
			} else {
				res.destroy();
			}
		});

		req.on("close", function () {
			upstream.destroy();
		});
	});
}

router.get(/.*/, handle);
router.head(/.*/, handle);

module.exports = router;
