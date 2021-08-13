import { RedisNotInitializedError } from "../src/exception"
import { RedisService } from "../src"
describe("redis-service should pass all tests", () => {
	const redis = new RedisService({
		redisConfig: {
			host: "127.0.0.1",
			namespace: "redis-service-tests",
			port: 6379,
			queue: "redis-service-test-queue"
		}
	})
	const redis2 = new RedisService({
		redisConfig: {
			host: "127.0.0.1",
			namespace: "redis-service-tests",
			port: 6379,
			queue: "redis-service-test-queue"
		}
	})
	it("initialization should work", async () => {
		let failed = false
		try {
			await redis.initialize()
			await redis2.initialize()
		}
		catch (error) {
			failed = false
		}
		expect(failed).toBe(false)
	})
	it("should send a message", async () => {
		let failed = false
		try {
			await redis.send("test-message")
		}
		catch (error) {
			failed = true
		}
		expect(failed).toBe(false)
	})
	it("should receive a message", async () => {
		let failed = false
		let message = ""
		try {
			message = await redis.receive()
		}
		catch (error) {
			failed = true
		}
		expect(failed).toBe(false)
		expect(message).toEqual("test-message")
	})
	it("should not receive another message", async () => {
		let failed = false
		let message = ""
		try {
			message = await redis.receive()
		}
		catch (error) {
			failed = true
		}
		expect(failed).toBe(false)
		expect(message).toBeUndefined()
	})
	it("should send two messages", async () => {
		let failed = false
		try {
			await redis.send("test-message-1")
			await redis.send("test-message-2")
		}
		catch (error) {
			failed = true
		}
		expect(failed).toBe(false)
	})
	it("should receive only two messages", async () => {
		let failed = false
		let message1 = ""
		let message2 = ""
		let message3 = ""
		try {
			message1 = await redis.receive()
			message2 = await redis.receive()
			message3 = await redis.receive()
		}
		catch (error) {
			failed = true
		}
		expect(failed).toBe(false)
		expect(message1).toEqual("test-message-1")
		expect(message2).toEqual("test-message-2")
		expect(message3).toBeUndefined()
	})
	it("should send one message", async () => {
		let failed = false
		try {
			await redis.send("test-message-1")
		}
		catch (error) {
			failed = true
		}
		expect(failed).toBe(false)
	})
	it("second instance should not receive a message", async () => {
		let failed = false
		let message1 = ""
		let message2 = ""
		try {
			message1 = await redis.receive()
			message2 = await redis2.receive()
		}
		catch (error) {
			failed = true
		}
		expect(failed).toBe(false)
		expect(message1).toEqual("test-message-1")
		expect(message2).toBeUndefined()
	})
	it("should send two messages again", async () => {
		let failed = false
		try {
			await redis2.send("test-message-1")
			await redis.send("test-message-2")
		}
		catch (error) {
			failed = true
		}
		expect(failed).toBe(false)
	})
	it("second instance should receive a message", async () => {
		let failed = false
		let message1 = ""
		let message2 = ""
		try {
			message1 = await redis.receive()
			message2 = await redis2.receive()
		}
		catch (error) {
			failed = true
		}
		expect(failed).toBe(false)
		expect(message1).toEqual("test-message-1")
		expect(message2).toEqual("test-message-2")
	})
	it("teardown should work", async () => {
		let failed = false
		try {
			await redis.quit()
			await redis2.quit()
		}
		catch (error) {
			failed = false
		}
		expect(failed).toBe(false)
	})
	it("should only run when initialized", async () => {
		const testRedis = new RedisService({
			redisConfig: {
				host: "127.0.0.1",
				namespace: "redis-service-tests",
				port: 6379,
				queue: "redis-service-test-queue"
			}
		})
		let failed = false
		let isCorrectError = false
		try {
			await testRedis.send("foobar")
		}
		catch (error) {
			failed = true
			isCorrectError = error instanceof RedisNotInitializedError
		}
		expect(failed).toBe(true)
		expect(isCorrectError).toBe(true)
		await testRedis.quit()
	})
})
export {}