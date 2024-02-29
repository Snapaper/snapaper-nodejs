require("dotenv").config();
var redis = require("redis");

var redisClient = redis
	.createClient({
		url: process.env.REDIS_URL,
	})
	.on("connect", function () {
		console.log("Redis connected!");
	});

redisClient.connect();

var redisWrapper = {
	connected: redisClient.isOpen,
	del: (keys) => {
		return redisClient.del(keys);
	},
	hgetall: (key, fn) => {
		redisClient
			.hGetAll(key)
			.then((resp) => {
				fn(null, resp);
			})
			.catch((err) => {
				fn(err);
			});
	},
	hset: (key, field, value) => {
		return redisClient.hSet(key, field, value);
	},
	expire: (key, seconds) => {
		return redisClient.expire(key, seconds);
	},
};

module.exports = redisWrapper;
