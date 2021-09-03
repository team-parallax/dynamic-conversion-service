import { EConversionStatus } from "../src/api/conversion-client"
import { IConversionRequest } from "../src/interface"
import { RedisService } from "../src/service"
describe("redis-service should pass all tests", () => {
	let redisService: RedisService
	beforeAll(async (): Promise<void> => {
		process.env.WEBSERVICE_PORT = "3000"
		process.env.FFMPEG_PATH = "/opt/ffmpeg/bin/ffmpeg"
		process.env.IMAGE_MAGICK_PATH = "usr/bin/convert"
		process.env.UNOCONV_PATH = "/usr/bin/unoconv"
		process.env.MAX_CONVERSION_TIME = "90000"
		process.env.MAX_CONVERSION_TRIES = "5"
		process.env.CONVERTER_DOCUMENT_PRIORITY = "unoconv,imageMagick"
		process.env.CONVERTER_MEDIA_PRIORITY = "ffmpeg,imageMagick,unoconv"
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
		process.env.HEALTH_CHECK_INTERVAL = "120"
		process.env.APPLY_DESIRED_STATE_INTERVAL = "600"
		redisService = new RedisService()
		await redisService.initialize()
	})
	afterAll(async (): Promise<void> => {
		try {
			await redisService.quit()
		}
		catch (error) {
			// eslint-disable-next-line no-console
			console.log(error)
		}
	})
	const dummyRequest: IConversionRequest = {
		conversionRequestBody: {
			file: "foo.bar",
			filename: "foo.bar",
			originalFormat: "baz",
			targetFormat: "bar"
		},
		conversionStatus: EConversionStatus.Processing,
		externalConversionId: "random-id-external",
		workerConversionId: "random-id"
	}
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
})