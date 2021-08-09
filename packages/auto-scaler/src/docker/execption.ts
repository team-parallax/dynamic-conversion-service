export class InvalidDockerConnectionOptions extends Error {
	constructor() {
		super(
			"Invalid Docker connection options. Use socketPath OR host + port"
		)
		this.name = "InvalidDockerConfigurationError"
	}
}