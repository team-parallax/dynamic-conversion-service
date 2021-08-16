export class RedisWrapperPopError extends Error {
	constructor() {
		super("failed to pop message")
	}
}
export class RedisWrapperReceiveError extends Error {
	constructor() {
		super("failed to receive message")
	}
}
export class RedisWrapperSendError extends Error {
	constructor() {
		super("failed to send message")
	}
}
export class RedisWrapperQueueCreateError extends Error {
	constructor(queueName: string) {
		super(`failed to create queue : ${queueName}`)
	}
}
export class RedisWrapperQueueDeleteError extends Error {
	constructor(queueName: string) {
		super(`failed to delete queue : ${queueName}`)
	}
}
export class RedisWrapperQueueListError extends Error {
	constructor() {
		super("failed to list redis queues")
	}
}