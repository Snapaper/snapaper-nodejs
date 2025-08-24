var Crawler = require("crawler");
var express = require("express");
var router = express.Router();
/*
const Agent = require('socks5-https-client/lib/Agent');
*/

var c = new Crawler({
	skipEventRequest: false,
	maxConnections: 30,
	method: "GET",
	/*
  agentClass: Agent, //adding socks5 https agent
  agentOptions: {
    socksHost: '103.214.41.98',
    socksPort: 4145
  },
  */
});

// PastPapers.co
router.get("/ppco/:cate", function (req, res, next) {
	const server = "https://pastpapers.co";
	c.queue([
		{
			uri: `${server}/cie/?dir=${req.params.cate}`,
			callback: function (error, resC, done) {
				if (error) {
					console.log(error);
				} else {
					let $ = resC.$;
					let returnArray = {
						cates: new Array(),
						count: 0,
					};
					$(".blog_sidebar_left .dirRows label.headingwrap").each(function () {
						const subject = $(this).text().trim();

						if (
							subject.includes("-") &&
							!subject.includes("(") &&
							!subject.includes("9980") &&
							!subject.includes("&")
						) {
							const subjectName = subject
								.substring(0, subject.lastIndexOf("-"))
								.replaceAll("-", " ");
							const subjectCode = subject.substring(subject.lastIndexOf("-") + 1);
							returnArray.cates.push({
								name: `${subjectName} (${subjectCode})`,
							});
						}
					});
					returnArray.count = returnArray.cates.length;
					console.log(server + req.params.cate);
					res.send(JSON.stringify(returnArray));
				}
				done();
			},
		},
	]);
});

// PapaCambridge
// as-and-a-level
// igcse
router.get("/ppca/:cate", function (req, res, next) {
	const server = "https://pastpapers.papacambridge.com/papers/caie/";
	c.queue([
		{
			uri: `${server}${req.params.cate}`.toLowerCase(),
			callback: function (error, resC, done) {
				if (error) {
					console.log(error);
				} else {
					let $ = resC.$;
					let returnArray = {
						cates: new Array(),
						count: 0,
					};
					$("#datafile > div.files-list-main > div").each(function () {
						const subject = $(this).text().trim();

						if (subject.includes("-") && !subject.includes("No Content Available")) {
							const subjectName = subject
								.substring(0, subject.lastIndexOf("-"))
								.replaceAll("-", " ");
							const subjectCode = subject.substring(subject.lastIndexOf("-") + 2);
							returnArray.cates.push({
								name: `${subjectName} (${subjectCode})`,
							});
						}
					});
					returnArray.count = returnArray.cates.length;
					console.log(server + req.params.cate);
					res.send(JSON.stringify(returnArray));
				}
				done();
			},
		},
	]);
});

// GCE Guide
router.get("/:cate/:node", function (req, res, next) {
	if (parseInt(req.params.node) == 2) {
		var server = "https://papers.gceguide.xyz/";
	} else {
		var server = "https://papers.gceguide.cc/";
	}
	c.queue([
		{
			uri: server + req.params.cate,
			callback: function (error, resC, done) {
				if (error) {
					console.log(error);
				} else {
					let $ = resC.$;
					let returnArray = {
						cates: new Array(),
						count: 0,
					};
					if (parseInt(req.params.node) == 2) {
						$("tr>td>a").each(function () {
							if ($(this).text() !== "error_log") {
								returnArray.cates.push({
									name: $(this).text(),
								});
							}
						});
					} else {
						$(".dir>a").each(function () {
							if ($(this).text() !== "error_log") {
								returnArray.cates.push({
									name: $(this).text(),
								});
							}
						});
					}
					returnArray.count = returnArray.cates.length;
					console.log(server + req.params.cate);
					res.send(JSON.stringify(returnArray));
				}
				done();
			},
		},
	]);
});

module.exports = router;
