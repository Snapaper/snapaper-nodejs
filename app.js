var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
var redisClient = require("./utils/redis_wrapper");
var cache = require("apicache").options({
	redisClient,
	respectCacheControl: false,
}).middleware;

// Define routes
var indexRouter = require("./routes/index");
var catesRouter = require("./routes/cates");
var xyzPapersRouter = require("./routes/papers_gceguide_xyz");
var comPapersRouter = require("./routes/papers_gceguide_com");
var ppcoPapersRouter = require("./routes/pastpapers_co");
var yearsRouter = require("./routes/years");

var app = express();

// Setup views
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// Setup middleware
app.use(
	cors({
		origin: [
			"https://www.snapaper.com",
			"https://snapaper.com",
			"http://localhost:3000",
		],
	})
);
app.use(logger("dev"));
app.use(express.json());
app.use(
	express.urlencoded({
		extended: false,
	})
);
app.use(cookieParser());
app.use(cache("1 month"));

// Define routes
app.use("/api", indexRouter);
app.use("/api/cates", catesRouter);
app.use("/api/papers/xyz", xyzPapersRouter);
app.use("/api/papers/com", comPapersRouter);
app.use("/api/papers/ppco", ppcoPapersRouter);
app.use("/api/years", yearsRouter);

// Catch 404 and forward to the error handler
app.use(function (_req, _res, next) {
	next(createError(404));
});

// Error handler
app.use(function (err, req, res, _next) {
	// Set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get("env") === "development" ? err : {};

	// Render the error page
	res.status(err.status || 500);
	res.render("error");
});

module.exports = app;

// var proxy = require("express-http-proxy");
// Delegate requests for directory listing to an external server
// app.use(
// 	"/case/cases",
// 	proxy("http://121.4.202.14", {
// 		proxyReqPathResolver: function (req) {
// 			return `/case/cases?cate=${req.query["cate"]}&sub=${req.query["sub"]}`;
// 		},
// 	})
// );

// Delegate requests for static files to an external server
// app.use(
// 	"/case/:cate/:sub/:paper",
// 	proxy("http://121.4.202.14", {
// 		proxyReqPathResolver: function (req) {
// 			return `/case/${req.params.cate}/${req.params.sub}/${encodeURI(
// 				req.params.paper
// 			)}`;
// 		},
// 	})
// );

// Delegate requests for remote file download to an external server
// app.use(
// 	"/download",
// 	proxy("http://121.4.202.14", {
// 		proxyReqPathResolver: function (req) {
// 			return `/download?filename=${encodeURI(req.query["filename"])}`;
// 		},
// 	})
// );
