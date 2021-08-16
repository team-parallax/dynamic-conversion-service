import { IAutoScalerConfiguration } from "../../../auto-scaler/src/config"
import { IRedisServiceConfiguration } from "./interface"
import { InvalidAutoScalerConfiguration, InvalidRedisConfiguration } from "./exception"
export const getAutoScalerConfigFromEnv = () : IAutoScalerConfiguration => {
	let containerStartThreshold = 3
	const envThreshold = process.env.TASKS_PER_CONTAINER
	if (envThreshold) {
		containerStartThreshold = parseInt(envThreshold)
	}
	let maxContainers = 50
	const envMax = process.env.MAX_WORKER_CONTAINER
	if (envMax) {
		maxContainers = parseInt(envMax)
	}
	else {
		throw new InvalidAutoScalerConfiguration("MAX_WORKER_CONTAINER")
	}
	let minContainers = 50
	const envMin = process.env.MIN_WORKER_CONTAINER
	if (envMax) {
		minContainers = parseInt(envMax)
	}
	else {
		throw new InvalidAutoScalerConfiguration("MIN_WORKER_CONTAINER")
	}
	let containerLabel = "foo-bar-123"
	const envLabel = process.env.CONTAINER_LABEL
	if (envLabel) {
		containerLabel = envLabel
	}
	else {
		throw new InvalidAutoScalerConfiguration("CONTAINER_LABEL")
	}
	let imageId = "bash"
	const envImage = process.env.CONTAINER_IMAGE
	if (envImage) {
		imageId = envImage
	}
	else {
		throw new InvalidAutoScalerConfiguration("CONTAINER_IMAGE")
	}
	const tag = process.env.CONTAINER_TAG
	const socketPath = process.env.DOCKER_SOCKET_PATH
	const host = process.env.DOCKER_HOST
	const port = process.env.DOCKER_PORT
		? parseInt(process.env.DOCKER_PORT)
		: undefined
	return {
		containerStartThreshold,
		dockerConfig: {
			containerLabel,
			host,
			imageId,
			port,
			socketPath,
			tag
		},
		maxContainers,
		minContainers
	}
}
export const getRedisConfigFromEnv = (): IRedisServiceConfiguration => {
	const envHost = process.env.REDIS_HOST
	const envPort = process.env.REDIS_PORT
	const envNS = process.env.REDIS_NS
	const envQ = process.env.REDIS_QUEUE
	if (!envHost) {
		throw new InvalidRedisConfiguration("REDIS_HOST")
	}
	if (!envPort) {
		throw new InvalidRedisConfiguration("REDIS_PORT")
	}
	if (!envNS) {
		throw new InvalidRedisConfiguration("REDIS_NS")
	}
	if (!envQ) {
		throw new InvalidRedisConfiguration("REDIS_QUEUE")
	}
	return {
		redisConfig: {
			host: envHost,
			namespace: envNS,
			port: parseInt(envPort),
			queue: envQ
		}
	}
}
export * from "./interface"