export class InvalidRedisConfiguration extends Error {
	constructor(key: string) {
		super(`field '${key} is required!'`)
	}
}
export class InvalidAutoScalerConfiguration extends Error {
	constructor(key: string) {
		super(`field '${key} is required!'`)
	}
}