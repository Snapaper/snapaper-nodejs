var Crawler = require("crawler");
var express = require("express");
var router = express.Router();

var crawler = new Crawler({
	skipEventRequest: false,
	maxConnections: 30,
	method: "GET",
});

/* GET paper years (GCEGuide.com Only) */
router.get("/:cate/:sub", function (req, res, _next) {
	const server = "https://papers.gceguide.com";

	let sub = req.params.sub;
	if (req.params.sub == "Business Studies (9707)") {
		sub = "Business%20Studies%20%20(9707)";
	}

	const uri = server + "/" + req.params.cate + "/" + sub;

	crawler.queue([
		{
			uri: uri,
			callback: function (error, resC, done) {
				if (error) {
					console.log(error);
				} else {
					let $ = resC.$;
					let returnArray = {
						years: new Array(),
						count: 0,
					};
					$(".dir>a").each(function () {
						if ($(this).text() !== "error_log") {
							returnArray.years.push({
								name: $(this).text(),
							});
						}
					});
					returnArray.count = returnArray.years.length;
					res.send(JSON.stringify(returnArray));
				}
				done();
			},
		},
	]);
});

module.exports = router;
