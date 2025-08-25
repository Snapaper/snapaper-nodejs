/**
 * CORS Configuration
 *
 * This module exports the CORS configuration for the application.
 * It handles both production and development environments.
 */

// Production origins
const productionOrigins = ["https://www.snapaper.com", "https://snapaper.com"];

// Development origins
const developmentOrigins = [
	"http://localhost:3000",
	"http://localhost:3001",
	"http://localhost:5173", // Vite default
	"http://localhost:5174",
	"http://127.0.0.1:3000",
	"http://127.0.0.1:3001",
	"http://127.0.0.1:5173",
	"http://127.0.0.1:5174",
];

// Get allowed origins based on environment
function getAllowedOrigins() {
	const origins = [...productionOrigins];

	// Add development origins if not in production
	if (process.env.NODE_ENV !== "production") {
		origins.push(...developmentOrigins);
	}

	// Add custom origins from environment variables if provided
	if (process.env.CORS_ALLOWED_ORIGINS) {
		const customOrigins = process.env.CORS_ALLOWED_ORIGINS.split(",").map((origin) =>
			origin.trim()
		);
		origins.push(...customOrigins);
	}

	return origins;
}

// CORS options configuration
const corsOptions = {
	origin: function (origin, callback) {
		const allowedOrigins = getAllowedOrigins();

		// Allow requests with no origin (like mobile apps, Postman, or server-to-server)
		if (!origin) {
			return callback(null, true);
		}

		// Check if the origin is in the allowed list
		if (allowedOrigins.indexOf(origin) !== -1) {
			callback(null, true);
		} else {
			// Log rejected origin in development
			if (process.env.NODE_ENV !== "production") {
				console.warn(`CORS: Rejected request from origin: ${origin}`);
			}
			// Don't throw error, just return false to reject the request
			callback(null, false);
		}
	},

	// Allow cookies and authentication headers
	credentials: true,

	// Allowed HTTP methods
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],

	// Allowed request headers
	allowedHeaders: [
		"Content-Type",
		"Authorization",
		"X-Requested-With",
		"Accept",
		"Origin",
		"Cache-Control",
		"X-Api-Key",
		"X-Access-Token",
		"X-Session-Id",
		"X-Request-Id",
	],

	// Headers exposed to the client
	exposedHeaders: [
		"X-Total-Count",
		"X-Page-Count",
		"Content-Range",
		"X-Request-Id",
		"X-Response-Time",
		"X-Rate-Limit-Remaining",
		"X-Rate-Limit-Reset",
	],

	// Cache preflight response for 24 hours
	maxAge: 86400,

	// Some legacy browsers choke on 204
	optionsSuccessStatus: 200,

	// Pass the CORS preflight check for cookies
	preflightContinue: false,
};

// Export configuration
module.exports = {
	corsOptions,
	getAllowedOrigins,
};
