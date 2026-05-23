var Crawler = require("crawler");

var crawler = new Crawler({
	skipEventRequest: false,
	maxConnections: 30,
	method: "GET",
	userAgent:
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
	headers: {
		Accept:
			"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
		"Accept-Language": "en-US,en;q=0.5",
	},
});

const SERVER = "https://www.papersdaddy.com";

const LEVEL_MAP = {
	"as-and-a-level": "a-level",
	"a-level": "a-level",
	"as-level": "a-level",
	"igcse": "igcse",
	"o-level": "o-level",
};

function toSubjectSlug(sub) {
	return sub
		.replace(/&/g, "and")
		.replace(/[()]/g, "")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "")
		.toLowerCase();
}

function buildSubjectUrl(cate, sub) {
	const level = LEVEL_MAP[cate.toLowerCase()] || cate.toLowerCase();
	return `${SERVER}/cambridge/${level}/${toSubjectSlug(sub)}`;
}

function inputYearToSlug(year) {
	const lower = year.toLowerCase();
	const m = /(\d{4})/.exec(lower);
	if (!m) return null;
	const yyyy = m[1];
	if (/march|mar(?![a-z])/.test(lower)) return `${yyyy}-march`;
	if (/may|jun|summer/.test(lower)) return `${yyyy}-may-june`;
	if (/oct|nov|winter/.test(lower)) return `${yyyy}-oct-nov`;
	return null;
}

function yearSlugToDisplay(slug) {
	if (slug.endsWith("-may-june")) return slug.replace("-may-june", "-May-Jun");
	if (slug.endsWith("-oct-nov")) return slug.replace("-oct-nov", "-Oct-Nov");
	if (slug.endsWith("-march")) return slug.replace("-march", "-March");
	return slug;
}

const SEASON_ORDER = { March: 0, "May-Jun": 1, "Oct-Nov": 2 };

function yearSortKey(name) {
	const m = /^(\d{4})-(March|May-Jun|Oct-Nov)$/.exec(name);
	if (!m) return [0, 0];
	return [parseInt(m[1], 10), SEASON_ORDER[m[2]]];
}

function fileInfo(name) {
	if (name.indexOf("Data_Booklet") > -1) return "Data Booklet";
	if (name.indexOf("sci") > -1) return "Specimen Confidential Instruction";
	if (name.indexOf("sp") > -1) return "Specimen Paper";
	if (name.indexOf("sm") > -1) return "Specimen Mark Scheme";
	if (name.indexOf("qp") > -1) return "Question Paper";
	if (name.indexOf("ms") > -1) return "Mark Scheme";
	if (name.indexOf("er") > -1) return "Examiner Report";
	if (name.indexOf("ir") > -1 || name.indexOf("ci") > -1) return "Confidential Instruction";
	if (name.indexOf("gt") > -1) return "Grade thresholds";
	if (name.indexOf("in") > -1) return "Inert";
	return "Unknown";
}

function fileType(name) {
	if (name.endsWith(".pdf")) return "PDF";
	if (name.endsWith(".mp3")) return "MP3";
	if (name.endsWith(".docx") || name.endsWith(".doc")) return "DOC";
	return "Unknown";
}

function escapeRe(s) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fetchYears(cate, sub, callback) {
	const uri = buildSubjectUrl(cate, sub);
	console.log(uri);
	const subjectPath = new URL(uri).pathname;
	const yearLinkRe = new RegExp(`^${escapeRe(subjectPath)}/(\\d{4}-(?:march|may-june|oct-nov))$`);

	crawler.queue([
		{
			uri,
			callback: function (error, resC, done) {
				if (error || !resC || resC.statusCode !== 200) {
					callback(error || new Error(`upstream ${resC && resC.statusCode}`), null);
					return done();
				}
				const $ = resC.$;
				const slugs = new Set();
				$("a[href]").each(function () {
					const href = $(this).attr("href") || "";
					const m = yearLinkRe.exec(href);
					if (m) slugs.add(m[1]);
				});

				const years = [...slugs]
					.map(yearSlugToDisplay)
					.sort((a, b) => {
						const [ay, as] = yearSortKey(a);
						const [by, bs] = yearSortKey(b);
						return by - ay || bs - as;
					});
				callback(null, years);
				done();
			},
		},
	]);
}

function fetchPapers(cate, sub, year, callback) {
	const yearSlug = inputYearToSlug(year);
	if (!yearSlug) {
		callback(new Error(`unrecognized year: ${year}`), null);
		return;
	}
	const subjectUrl = buildSubjectUrl(cate, sub);
	const uri = `${subjectUrl}/${yearSlug}`;
	console.log(uri);
	const yearPath = new URL(uri).pathname;
	const fileLinkRe = new RegExp(`^${escapeRe(yearPath)}/([^/]+\\.(?:pdf|mp3|docx?))$`);

	crawler.queue([
		{
			uri,
			callback: function (error, resC, done) {
				if (error || !resC || resC.statusCode !== 200) {
					callback(error || new Error(`upstream ${resC && resC.statusCode}`), null);
					return done();
				}
				const $ = resC.$;
				const seen = new Map();
				$("a[href]").each(function () {
					const href = $(this).attr("href") || "";
					const m = fileLinkRe.exec(href);
					if (m && !seen.has(m[1])) {
						seen.set(m[1], href);
					}
				});

				const yearCode = (() => {
					const ymatch = /(\d{4})/.exec(yearSlug);
					return ymatch ? ymatch[1].slice(-2) : "";
				})();

				const papers = [];
				let key = 0;
				for (const [filename, href] of seen) {
					key += 1;
					papers.push({
						name: filename,
						// Relative path — the route handler prepends the API base so
						// clients get an absolute URL pointing back to /api/download.
						// We can't return papersdaddy's URL directly because it serves
						// an HTML viewer, and the tokenized PDF URL expires in <5 min,
						// so a permanent proxy URL is the only correct contract here.
						url: `/api/download${href}`,
						key,
						info: [fileInfo(filename)],
						type: fileType(filename),
						year: yearCode,
					});
				}
				callback(null, papers);
				done();
			},
		},
	]);
}

const TOKEN_RE = /pdfUrl\\":\\"([^\\]+(?:\\u0026[^\\]+)*)/;

function resolveDownload(viewerPath, callback) {
	const uri = `${SERVER}${viewerPath.startsWith("/") ? "" : "/"}${viewerPath}`;
	crawler.queue([
		{
			uri,
			callback: function (error, resC, done) {
				if (error || !resC || resC.statusCode !== 200) {
					callback(error || new Error(`upstream ${resC && resC.statusCode}`), null);
					return done();
				}
				const body = resC.body ? resC.body.toString() : "";
				const m = TOKEN_RE.exec(body);
				if (!m) {
					callback(new Error("download token not found in viewer page"), null);
					return done();
				}
				const tokenPath = m[1].replace(/\\u0026/g, "&");
				callback(null, `${SERVER}${tokenPath}`);
				done();
			},
		},
	]);
}

const LOWERCASE_WORDS = new Set([
	"and", "of", "the", "for", "in", "on", "to", "with", "a", "an",
]);

function slugToDisplayName(slug) {
	const lastDash = slug.lastIndexOf("-");
	if (lastDash < 0) return slug;
	const code = slug.slice(lastDash + 1);
	const name = slug
		.slice(0, lastDash)
		.split("-")
		.map((w, i) => {
			if (!w.length) return w;
			if (i > 0 && LOWERCASE_WORDS.has(w)) return w;
			return w[0].toUpperCase() + w.slice(1);
		})
		.join(" ");
	return `${name} (${code})`;
}

function fetchCates(cate, callback) {
	const level = LEVEL_MAP[cate.toLowerCase()] || cate.toLowerCase();
	const uri = `${SERVER}/cambridge/${level}`;
	console.log(uri);
	const subjectLinkRe = new RegExp(`^/cambridge/${escapeRe(level)}/([a-z0-9][a-z0-9-]*[a-z0-9]-\\d{4,5})$`);

	crawler.queue([
		{
			uri,
			callback: function (error, resC, done) {
				if (error || !resC || resC.statusCode !== 200) {
					callback(error || new Error(`upstream ${resC && resC.statusCode}`), null);
					return done();
				}
				const $ = resC.$;
				const slugs = new Set();
				$("a[href]").each(function () {
					const href = $(this).attr("href") || "";
					const m = subjectLinkRe.exec(href);
					if (m) slugs.add(m[1]);
				});

				const cates = [...slugs]
					.sort()
					.map((slug) => ({ name: slugToDisplayName(slug) }));
				callback(null, cates);
				done();
			},
		},
	]);
}

module.exports = { fetchYears, fetchPapers, fetchCates, resolveDownload };
