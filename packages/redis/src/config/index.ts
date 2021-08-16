import { IAutoScalerConfiguration } from "../../../auto-scaler/src/config"
import { IRedisServiceConfiguration } from "./interface"
import { InvalidConfigurationError } from "./exception"
const getAutoScalerConfigFromEnv = () : IAutoScalerConfiguration => {
	const tasksPerContainer = process.env.TASKS_PER_CONTAINER
	if (!tasksPerContainer) {
		throw new InvalidConfigurationError("auto-scaler", "TASKS_PER_CONTAINER")
	}
	if (isNaN(Number(tasksPerContainer))) {
		throw new InvalidConfigurationError("auto-scaler", "MAX_CONTAINERS", tasksPerContainer)
	}
	const maxContainers = process.env.MAX_WORKER_CONTAINER
	if (!maxContainers) {
		throw new InvalidConfigurationError("auto-scaler", "MAX_CONTAINERS")
	}
	if (isNaN(Number(maxContainers))) {
		throw new InvalidConfigurationError("auto-scaler", "MAX_CONTAINERS", maxContainers)
	}
	const minContainers = process.env.MIN_WORKER_CONTAINER
	if (!minContainers) {
		throw new InvalidConfigurationError("auto-scaler", "MIN_CONTAINERS")
	}
	if (isNaN(Number(minContainers))) {
		throw new InvalidConfigurationError("auto-scaler", "MAX_CONTAINERS", minContainers)
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
	const port = process.env.DOCKER_PORT
		? parseInt(process.env.DOCKER_PORT)
		: undefined
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
	if (isNaN(Number(envPort))) {
		throw new InvalidConfigurationError("redis-service", "REDIS_PORT", envPort)
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
		}
	}
}
export * from "./interface"