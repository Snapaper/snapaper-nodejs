// Load environment variables
require("dotenv").config();

var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
var { corsOptions } = require("./config/cors.config");
var redisClient = require("./utils/redis_wrapper");
var apicache = require("apicache");
var cache = apicache.options({
	redisClient,
	respectCacheControl: false,
	// Add origin to cache key to avoid CORS issues with cached responses
	appendKey: (req, res) => req.headers.origin || "",
}).middleware;

// Define routes
var indexRouter = require("./routes/index");
var catesRouter = require("./routes/cates");
var xyzPapersRouter = require("./routes/papers_gceguide_xyz");
var comPapersRouter = require("./routes/papers_gceguide_com");
var ppcoPapersRouter = require("./routes/pastpapers_co");
var ppcaPapersRouter = require("./routes/papacambridge_com");
var yearsRouter = require("./routes/years");

var app = express();

// Setup views
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// Setup middleware
// Apply CORS middleware with configuration from config file
app.use(cors(corsOptions));

// Custom middleware to handle CORS errors and provide debugging
app.use((req, res, next) => {
	// Log CORS requests in development
	if (process.env.NODE_ENV !== "production" && req.headers.origin) {
		console.log(
			`CORS Request from origin: ${req.headers.origin} to ${req.method} ${req.path}`
		);
	}

	// Handle preflight requests that weren't caught by cors middleware
	if (req.method === "OPTIONS") {
		return res.sendStatus(200);
	}

	next();
});

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
app.use("/api/papers/ppca", ppcaPapersRouter);
app.use("/api/years", yearsRouter);

app.get("/api/cache/clear", (_req, res) => {
	res.json(apicache.clear());
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

	// Check if this is a CORS error
	if (err && err.message && err.message.includes("CORS")) {
		return res.status(403).json({
			error: "CORS Policy Error",
			message:
				process.env.NODE_ENV === "production"
					? "Access denied by CORS policy"
					: err.message,
			origin: req.headers.origin || "not provided",
		});
	}

	// Handle JSON responses for API routes
	if (req.path.startsWith("/api")) {
		return res.status(err.status || 500).json({
			error: err.message || "Internal Server Error",
			status: err.status || 500,
			...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
		});
	}

	// Render the error page for non-API routes
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
