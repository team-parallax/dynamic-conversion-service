import { InvalidConfigurationError, InvalidConfigurationValueError } from "../src/config/exception"
import { getRedisConfigFromEnv, isStringNumber } from "../src/config"
describe("loading configuration fields from environment should work", () => {
	beforeEach(() => {
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
		process.env.MIN_WORKER_CONTAINERS = "1"
		process.env.CONTAINER_NAME_PREFIX = "conversion-service-worker"
		process.env.CONTAINER_IMAGE = "bash"
		process.env.CONTAINER_TAG = "latest"
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
			expect(isStringNumber("123")).toBe(true)
			expect(isStringNumber("0")).toBe(true)
			expect(isStringNumber("420691337")).toBe(true)
		})
		it("should report strings with trailing non-numeric characters as invalid", () => {
			expect(isStringNumber("120ff")).toBe(false)
			expect(isStringNumber("1__-123")).toBe(false)
			expect(isStringNumber("420foobar")).toBe(false)
		})
		it("should report non-numbers as invalid", () => {
			expect(isStringNumber("foo-bar")).toBe(false)
			expect(isStringNumber("0kekw123")).toBe(false)
			expect(isStringNumber("123_asasdposdkfg2134q23")).toBe(false)
		})
		it("should report undefined as invalid", () => {
			expect(isStringNumber(undefined)).toBe(false)
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
			delete process.env.MAX_WORKER_CONTAINERS
			expect(() => getRedisConfigFromEnv()).toThrowError(InvalidConfigurationError)
		})
		it("should throw an error when multiple required field is missing", () => {
			delete process.env.MAX_WORKER_CONTAINERS
			delete process.env.MIN_WORKER_CONTAINERS
			expect(() => getRedisConfigFromEnv()).toThrowError(InvalidConfigurationError)
		})
	})
	describe("it should handle invalid config option combinations", () => {
		it("should report missing docker port/host fields", () => {
			delete process.env.DOCKER_SOCKET_PATH
			delete process.env.DOCKER_HOST
			expect(() => getRedisConfigFromEnv()).toThrowError(InvalidConfigurationValueError)
			process.env.DOCKER_HOST = "127.0.0.1"
			delete process.env.DOCKER_PORT
			expect(() => getRedisConfigFromEnv()).toThrowError(InvalidConfigurationValueError)
		})
	})
})