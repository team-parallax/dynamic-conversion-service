import { IAutoScalerConfiguration } from "auto-scaler/src/config"
import {
	IRedisServiceConfiguration,
	ISchedulerConfiguration
} from "./interface"
import {
	InvalidConfigurationError,
	InvalidConfigurationValueError
} from "./exception"
export const isStringNumber = (stringNumber: string | undefined): boolean =>
	stringNumber
		? !isNaN(Number(stringNumber)) && /^\d+$/.test(stringNumber)
		: false
const getConversionServiceConfigFromEnv = (): string[] => {
	const envFfmpegPath = process.env.FFMPEG_PATH
	if (!envFfmpegPath) {
		throw new InvalidConfigurationError("conversion-service", "FFMPEG_PATH")
	}
	const envImageMagickPath = process.env.IMAGE_MAGICK_PATH
	if (!envImageMagickPath) {
		throw new InvalidConfigurationError("conversion-service", "IMAGE_MAGICK_PATH")
	}
	const envUnoConvPath = process.env.UNOCONV_PATH
	if (!envUnoConvPath) {
		throw new InvalidConfigurationError("conversion-service", "UNOCONV_PATH")
	}
	const envWebservicePort = process.env.WEBSERVICE_PORT
	if (!envWebservicePort) {
		throw new InvalidConfigurationError("conversion-service", "WEBSERVICE_PORT")
	}
	const envMaxConversionTime = process.env.MAX_CONVERSION_TIME
	if (!envMaxConversionTime) {
		throw new InvalidConfigurationError("conversion-service", "MAX_CONVERSION_TIME")
	}
	const envMaxConversionTries = process.env.MAX_CONVERSION_TRIES
	if (!envMaxConversionTries) {
		throw new InvalidConfigurationError("conversion-service", "MAX_CONVERSION_TRIES")
	}
	const envConverterDocumentPrio = process.env.CONVERTER_DOCUMENT_PRIORITY
	if (!envConverterDocumentPrio) {
		throw new InvalidConfigurationError("conversion-service", "CONVERTER_DOCUMENT_PRIORITY")
	}
	const envConverterMediaPrio = process.env.CONVERTER_MEDIA_PRIORITY
	if (!envConverterMediaPrio) {
		throw new InvalidConfigurationError("conversion-service", "CONVERTER_MEDIA_PRIORITY")
	}
	return [
		`FFMPEG_PATH=${envFfmpegPath}`,
		`IMAGE_MAGICK_PATH=${envImageMagickPath}`,
		`UNOCONV_PATH=${envUnoConvPath}`,
		`WEBSERVICE_PORT=${envWebservicePort}`,
		`MAX_CONVERSION_TIME=${envMaxConversionTime}`,
		`MAX_CONVERSION_TRIES=${envMaxConversionTries}`,
		`CONVERTER_DOCUMENT_PRIORITY=${envConverterDocumentPrio}`,
		`CONVERTER_MEDIA_PRIORITY=${envConverterMediaPrio}`
	]
}
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
	const containerNamePrefix = process.env.CONTAINER_NAME_PREFIX
	if (!containerNamePrefix) {
		throw new InvalidConfigurationError("auto-scaler", "CONTAINER_NAME_PREFIX")
	}
	const imageName = process.env.CONTAINER_IMAGE
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
	const useSocket = socketPath && (!host && !port)
	const useHostPort = host && port && !socketPath
	if (!(useSocket || useHostPort)) {
		throw new InvalidConfigurationValueError(
			"auto-scaler",
			"DOCKER_SOCKET_PATH|DOCKER_HOST|DOCKER_PORT",
			"Either use socketPath OR host+port"
		)
	}
	return {
		dockerConfig: {
			envVars: getConversionServiceConfigFromEnv(),
			host,
			imageName,
			namePrefix: containerNamePrefix,
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
	let healthCheckInterval: number = 120
	let stateApplicationInterval: number = 600
	if (envHealthInterval) {
		if (!isStringNumber(envHealthInterval)) {
			throw new InvalidConfigurationValueError(
				"redis-service",
				"HEALTH_CHECK_INTERVAL",
				envHealthInterval
			)
		}
		healthCheckInterval = parseInt(envHealthInterval)
	}
	if (envStateInterval) {
		if (!isStringNumber(envStateInterval)) {
			throw new InvalidConfigurationValueError(
				"redis-service",
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
	const envFileTtl = process.env.FILE_TTL
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
	let fileTtl = 3600
	if (envFileTtl) {
		if (!isStringNumber(envFileTtl)) {
			throw new InvalidConfigurationError("redis-service", "FILE_TTL")
		}
		fileTtl = parseInt(envFileTtl)
	}
	return {
		autoScalerConfig: getAutoScalerConfigFromEnv(),
		fileTtl,
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