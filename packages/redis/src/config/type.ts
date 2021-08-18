export type TConfigurationType = "auto-scaler" | "redis-service"
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
export type TRequiredKey =
	TRequiredAutoScalerConfigurationField | TRequiredRedisServiceConfigurationField