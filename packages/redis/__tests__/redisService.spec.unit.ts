import { RedisService } from "../src"
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
	it("should initialize without error", async (): Promise<void> => {
		redisService = new RedisService()
		await expect(redisService.initalize()).resolves.not.toThrowError()
	})
	it("should exit without error", async (): Promise<void> => {
		await expect(redisService.quit()).resolves.not.toThrowError()
	})
})