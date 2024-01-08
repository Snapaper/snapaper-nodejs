var Crawler = require("crawler");
var express = require("express");
var router = express.Router();

var c = new Crawler({
	skipEventRequest: false,
	maxConnections: 30,
	method: "GET",
});

const no_dash_subjects = {
	"Biblical studies (9484)": "Biblical studies-9484",
	"Islamic studies (9488)": "Islamic studies-9488",
	"French  (8277)": "French -8277",
};

router.get("/:cate/:sub/:year", function (req, res, next) {
	let sub = req.params.sub
		.replace("(", "")
		.replace(")", "")
		.replaceAll(" ", "-");

	if (no_dash_subjects[`${req.params.sub}`]) {
		sub = no_dash_subjects[`${req.params.sub}`];
	}

	var server = "https://pastpapers.co";
	var uri_url = `${server}/cie/${req.params.cate}/${sub}/${req.params.year}/`;
	var uri = `${server}/cie/?dir=${req.params.cate}/${sub}/${req.params.year}`;

	console.log(uri);
	c.queue([
		{
			uri: uri,
			callback: function (error, resC, done) {
				if (error) {
					console.log(error);
				} else {
					var $ = resC.$;
					var key = 0;
					var returnArray = {
						papers: new Array(),
						count: 0,
					};
					$(".blog_sidebar_left tbody.dirArray a.clearfix").each(function () {
						const name = $(this).text().trim();

						// key 字段
						key += 1;

						// info 字段
						if (name.indexOf("qp") > -1) {
							var info = "Question Paper";
						} else if (name.indexOf("ms") > -1) {
							var info = "Mark Scheme";
						} else if (name.indexOf("er") > -1) {
							var info = "Examiner Report";
						} else if (name.indexOf("ir") > -1 || name.indexOf("ci") > -1) {
							var info = "Confidential Instruction";
						} else if (name.indexOf("gt") > -1) {
							var info = "Grade thresholds";
						} else if (name.indexOf("Data_Booklet") > -1) {
							var info = "Data Booklet";
						} else if (name.indexOf("sci") > -1) {
							var info = "Specimen Confidential Instruction";
						} else if (name.indexOf("sp") > -1) {
							var info = "Specimen Paper";
						} else if (name.indexOf("sm") > -1) {
							var info = "Specimen Mark Scheme";
						} else if (name.indexOf("in") > -1) {
							var info = "Inert";
						} else {
							var info = "Unknown";
						}

						if (name.indexOf(".pdf") > -1) {
							returnArray.papers.push({
								name,
								url: uri_url + name,
								key: key,
								info: [info],
								type: "PDF",
								year: name.split("_")[1].substr(1),
							});
						}
					});

					returnArray.count = returnArray.papers.length;

					res.send(JSON.stringify(returnArray));
				}
				done();
			},
		},
	]);
});

module.exports = router;
