export class InvalidDockerConnectionOptions extends Error {
	constructor() {
		super(
			"Invalid Docker connection options. Use socketPath OR host + port"
		)
		this.name = "InvalidDockerConfigurationError"
	}
}
export class ContainerNotFoundError extends Error {
	constructor(containerId: string) {
		super(`No worker with containerId=${containerId}`)
	}
}
export class NoNetworkSpecifiedError extends Error {
	constructor() {
		super("No docker network has been specified")
	}
}