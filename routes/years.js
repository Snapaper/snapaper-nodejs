var Crawler = require("crawler");
var express = require("express");
var router = express.Router();

var crawler = new Crawler({
	skipEventRequest: false,
	maxConnections: 30,
	method: "GET",
});

const no_dash_subjects = {
	"Biblical studies (9484)": "Biblical studies-9484",
	"Islamic studies (9488)": "Islamic studies-9488",
	"French  (8277)": "French -8277",
};

router.get("/ppco/:cate/:sub", function (req, res, _next) {
	let sub = req.params.sub
		.replace("(", "")
		.replace(")", "")
		.replaceAll(" ", "-");

	if (no_dash_subjects[`${req.params.sub}`]) {
		sub = no_dash_subjects[`${req.params.sub}`];
	}

	const server = "https://pastpapers.co";
	const uri = `${server}/cie/?dir=${req.params.cate}/${sub}`;

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
					$(".blog_sidebar_left .dirRows label.headingwrap").each(function () {
						const date = $(this).text().trim();

						if (!date.includes("..")) {
							returnArray.years.push({
								name: date,
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

/* GET paper years (GCEGuide.com Only) */
router.get("/:cate/:sub", function (req, res, _next) {
	const server = "https://papers.gceguide.cc";

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
