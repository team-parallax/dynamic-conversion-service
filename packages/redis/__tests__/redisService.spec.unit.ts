import { EConversionStatus } from "../src/api/conversion-client"
import { IConversionRequest } from "../src/interface"
import { RedisService } from "../src/service"
describe("redis-service should pass all tests", () => {
	beforeAll(() => {
		process.env.TASKS_PER_CONTAINER = "5"
		process.env.MAX_WORKER_CONTAINERS = "10"
		process.env.MIN_WORKER_CONTAINERS = "5"
		process.env.CONTAINER_NAME_PREFIX = "conversion-service-worker"
		process.env.CONTAINER_IMAGE = "bash"
		process.env.CONTAINER_TAG = "latest"
		process.env.DOCKER_SOCKET_PATH = "/var/run/docker.sock"
		process.env.REDIS_HOST = "127.0.0.1"
		process.env.REDIS_PORT = "6379"
		process.env.REDIS_NS = "redis-service-test"
		process.env.REDIS_QUEUE = "redis-service-test-queue"
	})
	let redisService: RedisService
	const dummyRequest: IConversionRequest = {
		converionStatus: EConversionStatus.Processing,
		conversionId: "random-id",
		conversionRequestBody: {
			file: "foo.bar",
			filename: "foo.bar",
			originalFormat: "baz",
			targetFormat: "bar"
		}
	}
	it("should initialize without error", async (): Promise<void> => {
		redisService = new RedisService()
		await expect(redisService.initalize()).resolves.not.toThrowError()
	})
	it("should send a request", async () => {
		await expect(redisService.addRequestToQueue(dummyRequest))
			.resolves.not.toThrowError()
	})
	it("should have one request in the queue", async (): Promise<void> => {
		const expectedRequestCount = 1
		const requestCount = await redisService.getPendingRequestCount()
		expect(requestCount).toEqual(expectedRequestCount)
	})
	it("should retrieve the request from the queue", async () => {
		const request = await redisService.popRequest()
		expect(request).toEqual(dummyRequest)
	})
	it("should have zero requests in the queue", async (): Promise<void> => {
		const expectedRequestCount = 0
		const requestCount = await redisService.getPendingRequestCount()
		expect(requestCount).toEqual(expectedRequestCount)
	})
	it("should exit without error", async (): Promise<void> => {
		await expect(redisService.quit()).resolves.not.toThrowError()
	})
})