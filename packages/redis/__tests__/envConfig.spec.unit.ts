import { InvalidConfigurationError, InvalidConfigurationValueError } from "../src/config/exception"
import { getRedisConfigFromEnv, isNumber } from "../src/config"
describe("loading configuration fields from environment should work", () => {
	beforeEach(() => {
		process.env.TASKS_PER_CONTAINER = "5"
		process.env.MAX_WORKER_CONTAINERS = "10"
		process.env.MIN_WORKER_CONTAINERS = "1"
		process.env.CONTAINER_LABEL = "test-label"
		process.env.IMAGE_NAME = "bash"
		process.env.DOCKER_SOCKET_PATH = "/var/run/docker.sock"
		process.env.DOCKER_HOST = "127.0.0.1"
		process.env.DOCKER_PORT = "1234"
		process.env.REDIS_HOST = "127.0.0.1"
		process.env.REDIS_PORT = "6379"
		process.env.REDIS_NS = "test-ns"
		process.env.REDIS_QUEUE = "test-queue"
		process.env.HEALTH_CHECK_INTERVAL = "120"
		process.env.APPLY_DESIRED_STATE_INTERVAL = "700"
	})
	describe("number validation should work", () => {
		it("should report numbers as valid", () => {
			expect(isNumber("123")).toBe(true)
			expect(isNumber("0")).toBe(true)
			expect(isNumber("420691337")).toBe(true)
		})
		it("should report strings with trailing non-numeric characters as invalid", () => {
			expect(isNumber("120ff")).toBe(false)
			expect(isNumber("1__-123")).toBe(false)
			expect(isNumber("420foobar")).toBe(false)
		})
		it("should report non-numbers as invalid", () => {
			expect(isNumber("foo-bar")).toBe(false)
			expect(isNumber("0kekw123")).toBe(false)
			expect(isNumber("123_asasdposdkfg2134q23")).toBe(false)
		})
	})
	describe("it should load valid configurations", () => {
		it("should load a minimal valid configuration (docker socket)", () => {
			// Needed when validation of config is move to config loading
			delete process.env.DOCKER_HOST
			delete process.env.DOCKER_PORT
			expect(() => getRedisConfigFromEnv()).not.toThrowError()
		})
		it("should load a minimal valid configuration without optional fields", () => {
			delete process.env.CONTAINER_TAG
			// DOCKER_SOCKET is optional too but one will be required once
			// Validation is moved to config loading
			delete process.env.DOCKER_HOST
			delete process.env.DOCKER_PORT
			delete process.env.HEALTH_CHECK_INTERVAL
			delete process.env.APPLY_DESIRED_STATE_INTERVAL
			expect(() => getRedisConfigFromEnv()).not.toThrowError()
		})
	})
	describe("it should handle invalid values for fields", () => {
		it("should throw an error when loading a invalid number", () => {
			process.env.TASKS_PER_CONTAINER = "foobar"
			expect(() => getRedisConfigFromEnv()).toThrowError(InvalidConfigurationValueError)
		})
		it("should throw an error when loading a invalid number", () => {
			process.env.REDIS_PORT = "invalid123Value"
			expect(() => getRedisConfigFromEnv()).toThrowError(InvalidConfigurationValueError)
		})
		it("should throw an error when loading a optional invalid number", () => {
			process.env.HEALTH_CHECK_INTERVAL = "120ff"
			expect(() => getRedisConfigFromEnv()).toThrowError(InvalidConfigurationValueError)
		})
	})
	describe("it should handle missing required fields", () => {
		it("should throw an error when a required field is missing", () => {
			delete process.env.TASKS_PER_CONTAINER
			expect(() => getRedisConfigFromEnv()).toThrowError(InvalidConfigurationError)
		})
		it("should throw an error when a required field is missing", () => {
			delete process.env.REDIS_HOST
			expect(() => getRedisConfigFromEnv()).toThrowError(InvalidConfigurationError)
		})
		it("should throw an error when multiple required field is missing", () => {
			delete process.env.REDIS_HOST
			delete process.env.REDIS_PORT
			delete process.env.REDIS_NS
			delete process.env.REDIS_QUEUE
			expect(() => getRedisConfigFromEnv()).toThrowError(InvalidConfigurationError)
		})
	})
})
export {}