import { IAutoScalerConfiguration } from "auto-scaler/src/config"
import { IRedisServiceConfiguration, ISchedulerConfiguration } from "./interface"
import { InvalidConfigurationError, InvalidConfigurationValueError } from "./exception"
export const isStringNumber = (s: string | undefined): boolean =>
	s
		? !isNaN(Number(s)) && /^\d+$/.test(s)
		: false
const getAutoScalerConfigFromEnv = () : IAutoScalerConfiguration => {
	const tasksPerContainer = process.env.TASKS_PER_CONTAINER
	if (!tasksPerContainer) {
		throw new InvalidConfigurationError("auto-scaler", "TASKS_PER_CONTAINER")
	}
	if (!isStringNumber(tasksPerContainer)) {
		throw new InvalidConfigurationValueError("auto-scaler", "MAX_WORKER_CONTAINERS", tasksPerContainer)
	}
	const maxContainers = process.env.MAX_WORKER_CONTAINERS
	if (!maxContainers) {
		throw new InvalidConfigurationError("auto-scaler", "MAX_WORKER_CONTAINERS")
	}
	if (!isStringNumber(maxContainers)) {
		throw new InvalidConfigurationValueError("auto-scaler", "MAX_WORKER_CONTAINERS", maxContainers)
	}
	const minContainers = process.env.MIN_WORKER_CONTAINERS
	if (!minContainers) {
		throw new InvalidConfigurationError("auto-scaler", "MIN_WORKER_CONTAINERS")
	}
	if (!isStringNumber(minContainers)) {
		throw new InvalidConfigurationValueError("auto-scaler", "MIN_WORKER_CONTAINERS", minContainers)
	}
	const containerLabel = process.env.CONTAINER_LABEL
	if (!containerLabel) {
		throw new InvalidConfigurationError("auto-scaler", "CONTAINER_LABEL")
	}
	const imageName = process.env.CONTAINER_LABEL
	if (!imageName) {
		throw new InvalidConfigurationError("auto-scaler", "CONTAINER_IMAGE")
	}
	const tag = process.env.CONTAINER_TAG
	const socketPath = process.env.DOCKER_SOCKET_PATH
	const host = process.env.DOCKER_HOST
	let port: number | undefined = undefined
	const envPort = process.env.DOCKER_PORT
	if (envPort) {
		if (!isStringNumber(envPort)) {
			throw new InvalidConfigurationValueError("auto-scaler", "DOCKER_PORT", envPort)
		}
		port = parseInt(envPort)
	}
	return {
		dockerConfig: {
			containerLabel,
			host,
			imageName,
			port,
			socketPath,
			tag
		},
		maxContainers: parseInt(maxContainers),
		minContainers: parseInt(minContainers),
		tasksPerContainer: parseInt(tasksPerContainer)
	}
}
const getSchedulerConfigFromEnv = (): ISchedulerConfiguration => {
	const envHealthInterval = process.env.HEALTH_CHECK_INTERVAL
	const envStateInterval = process.env.APPLY_DESIRED_STATE_INTERVAL
	let healthCheckInterval: number | undefined = undefined
	let stateApplicationInterval: number | undefined = undefined
	if (envHealthInterval) {
		if (!isStringNumber(envHealthInterval)) {
			throw new InvalidConfigurationValueError(
				"auto-scaler",
				"HEALTH_CHECK_INTERVAL",
				envHealthInterval
			)
		}
		healthCheckInterval = parseInt(envHealthInterval)
	}
	if (envStateInterval) {
		if (!isStringNumber(envStateInterval)) {
			throw new InvalidConfigurationValueError(
				"auto-scaler",
				"APPLY_DESIRED_STATE_INTERVAL",
				envStateInterval
			)
		}
		stateApplicationInterval = parseInt(envStateInterval)
	}
	return {
		healthCheckInterval,
		stateApplicationInterval
	}
}
export const getRedisConfigFromEnv = (): IRedisServiceConfiguration => {
	const envHost = process.env.REDIS_HOST
	const envPort = process.env.REDIS_PORT
	const envNameSpace = process.env.REDIS_NS
	const envQueue = process.env.REDIS_QUEUE
	if (!envHost) {
		throw new InvalidConfigurationError("redis-service", "REDIS_HOST")
	}
	if (!envPort) {
		throw new InvalidConfigurationError("redis-service", "REDIS_PORT")
	}
	if (!isStringNumber(envPort)) {
		throw new InvalidConfigurationValueError("redis-service", "REDIS_PORT", envPort)
	}
	if (!envNameSpace) {
		throw new InvalidConfigurationError("redis-service", "REDIS_NS")
	}
	if (!envQueue) {
		throw new InvalidConfigurationError("redis-service", "REDIS_QUEUE")
	}
	return {
		autoScalerConfig: getAutoScalerConfigFromEnv(),
		redisConfig: {
			host: envHost,
			namespace: envNameSpace,
			port: parseInt(envPort),
			queue: envQueue
		},
		schedulerConfig: getSchedulerConfigFromEnv()
	}
}
export * from "./interface"