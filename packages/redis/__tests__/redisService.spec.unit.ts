import { RedisService } from "../src"
describe("redis-service should pass all tests", () => {
	beforeAll(() => {
		process.env.TASKS_PER_CONTAINER = "5"
		process.env.MAX_WORKER_CONTAINERS = "10"
		process.env.MIN_WORKER_CONTAINERS = "5"
		process.env.CONTAINER_LABEL = "redis-service-label"
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
		let failed = false
		try {
			redisService = new RedisService()
			await redisService.initalize()
		}
		catch (error) {
			failed = true
		}
		expect(failed).toBe(false)
	})
	it("should exit without error", async (): Promise<void> => {
		let failed = false
		try {
			await redisService.quit()
		}
		catch (error) {
			failed = true
		}
		expect(failed).toBe(false)
	})
})