import { InvalidConfigurationError } from "../src/config/exception"
import { getRedisConfigFromEnv } from "../src/config"
describe("loading configuration fields from environment should work", () => {
	afterEach(() => {
		delete process.env.TASKS_PER_CONTAINER
		delete process.env.MAX_WORKER_CONTAINER
		delete process.env.MIN_WORKER_CONTAINER
		delete process.env.CONTAINER_LABEL
		delete process.env.CONTAINER_IMAGE
		delete process.env.CONTAINER_TAG
		delete process.env.DOCKER_SOCKET_PATH
		delete process.env.DOCKER_HOST
		delete process.env.DOCKER_PORT
		delete process.env.REDIS_HOST
		delete process.env.REDIS_PORT
		delete process.env.REDIS_NS
		delete process.env.REDIS_QUEUE
	})
	describe("it should load valid configurations", () => {
		it("should load a minimal valid configuration (docker socket)", () => {
			process.env.TASKS_PER_CONTAINER = "5"
			process.env.MAX_WORKER_CONTAINERS = "10"
			process.env.MIN_WORKER_CONTAINERS = "1"
			process.env.CONTAINER_LABEL = "test-label"
			process.env.IMAGE_NAME = "bash"
			process.env.DOCKER_SOCKET_PATH = "/var/run/docker.sock"
			process.env.REDIS_HOST = "127.0.0.1"
			process.env.REDIS_PORT = "6379"
			process.env.REDIS_NS = "test-ns"
			process.env.REDIS_QUEUE = "test-queue"
			expect(() => getRedisConfigFromEnv()).not.toThrowError()
		})
		it("should load a minimal valid configuration (docker host/port)", () => {
			process.env.TASKS_PER_CONTAINER = "5"
			process.env.MAX_WORKER_CONTAINERS = "10"
			process.env.MIN_WORKER_CONTAINERS = "1"
			process.env.CONTAINER_LABEL = "test-label"
			process.env.IMAGE_NAME = "bash"
			process.env.DOCKER_HOST = "127.0.0.1"
			process.env.DOCKER_PORT = "1234"
			process.env.REDIS_HOST = "127.0.0.1"
			process.env.REDIS_PORT = "6379"
			process.env.REDIS_NS = "test-ns"
			process.env.REDIS_QUEUE = "test-queue"
			expect(() => getRedisConfigFromEnv()).not.toThrowError()
		})
	})
	describe("it should handle invalid values for fields", () => {
		it("should throw an error when loading a invalid number", () => {
			process.env.TASKS_PER_CONTAINER = "foobar"
			expect(() => getRedisConfigFromEnv()).toThrowError(InvalidConfigurationError)
		})
		it("should throw an error when loading a invalid number", () => {
			process.env.TASKS_PER_CONTAINER = "5"
			process.env.MAX_WORKER_CONTAINERS = "10"
			process.env.MIN_WORKER_CONTAINERS = "1"
			process.env.CONTAINER_LABEL = "test-label"
			process.env.IMAGE_NAME = "bash"
			process.env.DOCKER_SOCKET_PATH = "/var/run/docker.sock"
			process.env.REDIS_HOST = "127.0.0.1"
			process.env.REDIS_PORT = "foobar69420"
			expect(() => getRedisConfigFromEnv()).toThrowError(InvalidConfigurationError)
		})
	})
	describe("it should handle missing required fields", () => {
		it("should throw an error when a required field is missing", () => {
			// Process.env.TASKS_PER_CONTAINER = "5"
			process.env.MAX_WORKER_CONTAINERS = "10"
			process.env.MIN_WORKER_CONTAINERS = "1"
			process.env.CONTAINER_LABEL = "test-label"
			process.env.IMAGE_NAME = "bash"
			process.env.DOCKER_SOCKET_PATH = "/var/run/docker.sock"
			process.env.REDIS_HOST = "127.0.0.1"
			process.env.REDIS_PORT = "6379"
			process.env.REDIS_NS = "test-ns"
			process.env.REDIS_QUEUE = "test-queue"
			expect(() => getRedisConfigFromEnv()).toThrowError(InvalidConfigurationError)
		})
		it("should throw an error when a required field is missing", () => {
			process.env.TASKS_PER_CONTAINER = "5"
			process.env.MAX_WORKER_CONTAINERS = "10"
			process.env.MIN_WORKER_CONTAINERS = "1"
			// P// Process.env.CONTAINER_LABEL = "test-label"
			process.env.IMAGE_NAME = "bash"
			process.env.DOCKER_SOCKET_PATH = "/var/run/docker.sock"
			process.env.REDIS_HOST = "127.0.0.1"
			process.env.REDIS_PORT = "6379"
			process.env.REDIS_NS = "test-ns"
			process.env.REDIS_QUEUE = "test-queue"
			expect(() => getRedisConfigFromEnv()).toThrowError(InvalidConfigurationError)
		})
		it("should throw an error when a required field is missing", () => {
			process.env.TASKS_PER_CONTAINER = "5"
			process.env.MAX_WORKER_CONTAINERS = "10"
			process.env.MIN_WORKER_CONTAINERS = "1"
			process.env.CONTAINER_LABEL = "test-label"
			process.env.IMAGE_NAME = "bash"
			process.env.DOCKER_SOCKET_PATH = "/var/run/docker.sock"
			// Process.env.REDIS_HOST = "127.0.0.1"
			// Process.env.REDIS_PORT = "6379"
			// Process.env.REDIS_NS = "test-ns"
			// Process.env.REDIS_QUEUE = "test-queue"
			expect(() => getRedisConfigFromEnv()).toThrowError(InvalidConfigurationError)
		})
	})
})
export {}