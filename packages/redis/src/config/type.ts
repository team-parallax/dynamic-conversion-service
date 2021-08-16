export type TConfigurationType = "auto-scaler" | "redis-service"
export type TRequiredAutoScalerConfigurationField =
	| "MAX_CONTAINERS"
    | "MIN_CONTAINERS"
	| "TASKS_PER_CONTAINER"
	| "CONTAINER_LABEL"
	| "CONTAINER_IMAGE"
export type TRequiredRedisServiceConfigurationField =
	| "REDIS_HOST"
	| "REDIS_PORT"
	| "REDIS_NS"
	| "REDIS_QUEUE"
export type TRequiredKey =
	TRequiredAutoScalerConfigurationField | TRequiredRedisServiceConfigurationField