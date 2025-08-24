var Crawler = require("crawler");
var express = require("express");
var router = express.Router();

var c = new Crawler({
	skipEventRequest: false,
	maxConnections: 30,
	method: "GET",
});

router.get("/:cate/:sub/:year", function (req, res, next) {
	let sub = req.params.sub.replace("(", "").replace(")", "").replaceAll(" ", "-");

	var server = "https://pastpapers.papacambridge.com/papers/caie/";
	var uri = `${server}${req.params.cate}-${sub}-${req.params.year}`;

	console.log(uri);
	c.queue([
		{
			uri: uri.toLowerCase(),
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
					$("#datafile > div.files-list-main > div").each(function () {
						const paper_uri = $(this)
							.find("span.kt-widget2__number.kt-font-danger.cursor > div > a")
							.attr("href")
							.replace("download_file.php?files=", "");
						const name = paper_uri.split("/").pop();

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
								url: paper_uri,
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
