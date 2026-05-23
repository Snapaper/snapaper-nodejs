var express = require("express");
var router = express.Router();
var { fetchPapers } = require("../utils/papersdaddy_wrapper");

router.get("/:cate/:sub/:year", function (req, res, _next) {
	fetchPapers(req.params.cate, req.params.sub, req.params.year, function (err, papers) {
		if (err) {
			console.log(err);
			return res.status(502).json({ papers: [], count: 0, error: err.message });
		}
		const base = `${req.protocol}://${req.get("host")}`;
		const out = papers.map((p) => ({ ...p, url: `${base}${p.url}` }));
		res.json({ papers: out, count: out.length });
	});
});

module.exports = router;
