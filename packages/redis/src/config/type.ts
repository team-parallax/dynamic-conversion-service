export type TConfigurationType = "auto-scaler" | "redis-service" | "conversion-service"
export type TRequiredAutoScalerConfigurationField =
	| "MAX_WORKER_CONTAINERS"
    | "MIN_WORKER_CONTAINERS"
	| "TASKS_PER_CONTAINER"
	| "CONTAINER_NAME_PREFIX"
	| "CONTAINER_IMAGE"
export type TRequiredRedisServiceConfigurationField =
	| "REDIS_HOST"
	| "REDIS_PORT"
	| "REDIS_NS"
	| "REDIS_QUEUE"
export type TRequiredConversionServiceConfigurationField =
	| "FFMPEG_PATH"
	| "IMAGE_MAGICK_PATH"
	| "UNOCONV_PATH"
	| "WEBSERVICE_PORT"
	| "MAX_CONVERSION_TIME"
	| "MAX_CONVERSION_TRIES"
	| "CONVERTER_DOCUMENT_PRIORITY"
	| "CONVERTER_MEDIA_PRIORITY"
export type TRequiredKey =
	TRequiredAutoScalerConfigurationField
	| TRequiredRedisServiceConfigurationField
	| TRequiredConversionServiceConfigurationField