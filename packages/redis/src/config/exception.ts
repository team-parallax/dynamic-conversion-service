import { TConfigurationType, TRequiredKey } from "./type"
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