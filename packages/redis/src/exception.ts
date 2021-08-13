export class RedisNotInitializedError extends Error {
	constructor() {
		super("redis-service has not been initialized")
	}
}