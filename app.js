var createError = require("http-errors");
var express = require("express");
var request = require("request");
var path = require("path");
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

// Delegate request for static files stored on Tencent Cloud server
app.use("/case/cases", function (req, res) {
	const cate = req.query["cate"];
	const sub = req.query["sub"];

	request.get(
		`http://121.4.202.14/case/cases?cate=${cate}&sub=${sub}`,
		{
			rejectUnauthorized: false,
		},
		function (err, _res, body) {
			if (!err) {
				res.json(JSON.parse(body));
			}
		}
	);
});

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
