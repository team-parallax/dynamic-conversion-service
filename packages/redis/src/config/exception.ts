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
export class InvalidConfigurationError extends Error {
	constructor(
		configType: TConfigurationType,
		key: TRequiredKey,
		value?: string
	) {
		if (value) {
			super(`Invalid value for field ${key}=${value} for ${configType}`)
		}
		else {
			super(`Configuration Field ${key} is required for ${configType}`)
		}
	}
}