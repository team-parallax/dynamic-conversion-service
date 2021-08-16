import { IAutoScalerConfiguration } from "auto-scaler/src/config"
import { IRedisServiceConfiguration, ISchedulerConfiguration } from "./interface"
import { InvalidConfigurationError, InvalidConfigurationValueError } from "./exception"
export const isNumber = (s: string | undefined): boolean =>
	s
		? !isNaN(Number(s)) && /^\d+$/.test(s)
		: false
const getAutoScalerConfigFromEnv = () : IAutoScalerConfiguration => {
	const tasksPerContainer = process.env.TASKS_PER_CONTAINER
	if (!tasksPerContainer) {
		throw new InvalidConfigurationError("auto-scaler", "TASKS_PER_CONTAINER")
	}
	if (!isNumber(tasksPerContainer)) {
		throw new InvalidConfigurationValueError("auto-scaler", "MAX_WORKER_CONTAINERS", tasksPerContainer)
	}
	const maxContainers = process.env.MAX_WORKER_CONTAINERS
	if (!maxContainers) {
		throw new InvalidConfigurationError("auto-scaler", "MAX_WORKER_CONTAINERS")
	}
	if (!isNumber(maxContainers)) {
		throw new InvalidConfigurationValueError("auto-scaler", "MAX_WORKER_CONTAINERS", maxContainers)
	}
	const minContainers = process.env.MIN_WORKER_CONTAINERS
	if (!minContainers) {
		throw new InvalidConfigurationError("auto-scaler", "MIN_WORKER_CONTAINERS")
	}
	if (!isNumber(minContainers)) {
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
		if (!isNumber(envPort)) {
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
		if (!isNumber(envHealthInterval)) {
			throw new InvalidConfigurationValueError(
				"auto-scaler",
				"HEALTH_CHECK_INTERVAL",
				envHealthInterval
			)
		}
		healthCheckInterval = parseInt(envHealthInterval)
	}
	if (envStateInterval) {
		if (!isNumber(envStateInterval)) {
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
	const envNS = process.env.REDIS_NS
	const envQ = process.env.REDIS_QUEUE
	if (!envHost) {
		throw new InvalidConfigurationError("redis-service", "REDIS_HOST")
	}
	if (!envPort) {
		throw new InvalidConfigurationError("redis-service", "REDIS_PORT")
	}
	if (!isNumber(envPort)) {
		throw new InvalidConfigurationValueError("redis-service", "REDIS_PORT", envPort)
	}
	if (!envNS) {
		throw new InvalidConfigurationError("redis-service", "REDIS_NS")
	}
	if (!envQ) {
		throw new InvalidConfigurationError("redis-service", "REDIS_QUEUE")
	}
	return {
		autoScalerConfig: getAutoScalerConfigFromEnv(),
		redisConfig: {
			host: envHost,
			namespace: envNS,
			port: parseInt(envPort),
			queue: envQ
		},
		schedulerConfig: getSchedulerConfigFromEnv()
	}
}
export * from "./interface"