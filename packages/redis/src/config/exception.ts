import { TConfigurationType, TRequiredKey } from "./type"
export class InvalidConfigurationError extends Error {
	constructor(
		configType: TConfigurationType,
		key: TRequiredKey
	) {
		super(`Configuration Field ${key} is required for ${configType}`)
	}
}
export class InvalidConfigurationValueError extends Error {
	constructor(
		configType: TConfigurationType,
		key: string,
		value: string
	) {
		super(`Invalid value for field ${key}=${value} for ${configType}`)
	}
}