var createError = require("http-errors");
var express = require("express");
var request = require("request");
var path = require("path");
var proxy = require("express-http-proxy");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");

var indexRouter = require("./routes/index");
var catesRouter = require("./routes/cates");
var xyzPapersRouter = require("./routes/papers_gceguide_xyz");
var comPapersRouter = require("./routes/papers_gceguide_com");
var yearsRouter = require("./routes/years");

var app = express();

// Setup views
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// Setup middleware
app.use(
	cors({
		origin: /snapaper\.com$/,
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

// Define routes
app.use("/api", indexRouter);
app.use("/api/cates", catesRouter);
app.use("/api/papers/xyz", xyzPapersRouter);
app.use("/api/papers/com", comPapersRouter);
app.use("/api/years", yearsRouter);

// Delegate requests for directory listing of the Tencent Cloud server
app.use(
	"/case/cases",
	proxy("http://121.4.202.14", {
		proxyReqPathResolver: function (req) {
			return `/case/cases?cate=${req.query["cate"]}&sub=${req.query["sub"]}`;
		},
	})
);

// Delegate requests for static files stored the Tencent Cloud server
app.use(
	"/case/:cate/:sub/:paper",
	proxy("http://121.4.202.14", {
		proxyReqPathResolver: function (req) {
			return `/case/${req.params.cate}/${req.params.sub}/${encodeURI(
				req.params.paper
			)}`;
		},
	})
);

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
