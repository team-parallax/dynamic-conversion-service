import { IAutoScalerConfiguration } from "../../../auto-scaler/src/config"
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
	let minContainers = 50
	const envMin = process.env.MIN_WORKER_CONTAINER
	if (envMax) {
		minContainers = parseInt(envMax)
	}
	let containerLabel = "foo-bar-123"
	const envLabel = process.env.CONTAINER_LABEL
	if (envLabel) {
		containerLabel = envLabel
	}
	let imageId = "bash"
	const envImage = process.env.CONTAINER_IMAGE
	if (envImage) {
		imageId = envImage
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
export * from "./interface"