import { Logger } from "../../logger/src"
import { RedisWrapper } from "../src/wrapper"
import { RedisWrapperNotInitializedError } from "../src/wrapper/exception"
describe("redis-wrapper should pass all tests", () => {
	const logger = new Logger({
		serviceName: "redis-wrapper-test"
	})
	const redis = new RedisWrapper({
		host: "127.0.0.1",
		namespace: "redis-service-tests",
		port: 6379,
		queue: "redis-service-test-queue"
	}, logger)
	const redis2 = new RedisWrapper({
		host: "127.0.0.1",
		namespace: "redis-service-tests",
		port: 6379,
		queue: "redis-service-test-queue"
	}, logger)
	it("initialization should work", async (): Promise<void> => {
		await expect(redis.initialize()).resolves.not.toThrowError()
		await expect(redis2.initialize()).resolves.not.toThrowError()
	})
	it("should send a message", async () => {
		await expect(redis.sendMessage("test-message")).resolves.not.toThrowError()
	})
	it("should have one pending message", async () => {
		const pendingMessagesCount = await redis.getPendingMessagesCount()
		expect(pendingMessagesCount).toEqual(1)
	})
	it("should receive a message", async () => {
		await expect(redis.receiveMessage()).resolves.toEqual("test-message")
	})
	it("should have zero pending message", async () => {
		const pendingMessagesCount = await redis.getPendingMessagesCount()
		expect(pendingMessagesCount).toEqual(0)
	})
	it("should not receive another message", async () => {
		await expect(redis.receiveMessage()).resolves.toBeUndefined()
	})
	it("should send two messages", async () => {
		await expect(redis.sendMessage("test-message-1")).resolves.not.toThrowError()
		await expect(redis.sendMessage("test-message-2")).resolves.not.toThrowError()
	})
	it("should have two pending message", async () => {
		const pendingMessagesCount = await redis.getPendingMessagesCount()
		const expected = 2
		expect(pendingMessagesCount).toEqual(expected)
	})
	it("should receive only two messages", async () => {
		await expect(redis.receiveMessage()).resolves.toEqual("test-message-1")
		await expect(redis.receiveMessage()).resolves.toEqual("test-message-2")
		await expect(redis.receiveMessage()).resolves.toBeUndefined()
	})
	it("should have zero pending message", async () => {
		const pendingMessagesCount = await redis.getPendingMessagesCount()
		expect(pendingMessagesCount).toEqual(0)
	})
	it("should send one message", async () => {
		await expect(redis.sendMessage("test-message-1")).resolves.not.toThrowError()
	})
	it("second instance should not receive a message", async () => {
		await expect(redis.receiveMessage()).resolves.toEqual("test-message-1")
		await expect(redis2.receiveMessage()).resolves.toBeUndefined()
	})
	it("should have zero pending message", async () => {
		const pendingMessagesCount = await redis.getPendingMessagesCount()
		expect(pendingMessagesCount).toEqual(0)
	})
	it("should send two messages again", async () => {
		await expect(redis2.sendMessage("test-message-1")).resolves.not.toThrowError()
		await expect(redis.sendMessage("test-message-2")).resolves.not.toThrowError()
	})
	it("should have two pending message", async () => {
		const pendingMessagesCount = await redis.getPendingMessagesCount()
		const expected = 2
		expect(pendingMessagesCount).toEqual(expected)
	})
	it("second instance should receive a message", async () => {
		await expect(redis.receiveMessage()).resolves.toEqual("test-message-1")
		await expect(redis2.receiveMessage()).resolves.toEqual("test-message-2")
	})
	it("teardown should work", async () => {
		await expect(redis.quit()).resolves.not.toThrowError()
		await expect(redis2.quit()).resolves.not.toThrowError()
	})
	it("should only run when initialized", async () => {
		const testRedis = new RedisWrapper({
			host: "127.0.0.1",
			namespace: "redis-service-tests",
			port: 6379,
			queue: "redis-service-test-queue"
		}, logger)
		await expect(testRedis.sendMessage("foobar"))
			.rejects.toThrowError(RedisWrapperNotInitializedError)
		await expect(testRedis.quit()).resolves.not.toThrowError()
	})
})
export {}