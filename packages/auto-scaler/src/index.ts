import { DockerService } from "./docker"
import { IAutoScalerConfiguration } from "./config"
import { IContainerInfo } from "./docker/interface"
import { IContainerStatus } from "./interface"
import winston from "winston"
export class AutoScaler {
	private readonly config: IAutoScalerConfiguration
	private readonly dockerService: DockerService
	private readonly logger: winston.Logger
	constructor(config: IAutoScalerConfiguration) {
		this.config = config
		const {
			dockerConfig
		} = this.config
		this.logger = winston.createLogger({
			defaultMeta: {
				service: "auto-scaler"
			},
			format: winston.format.simple(),
			level: "info",
			transports: [
				new winston.transports.Console({
					format: winston.format.simple()
				})
			]
		})
		this.dockerService = new DockerService(dockerConfig, this.logger)
	}
	public applyConfigurationState = async (status: IContainerStatus, idleContainerIds?: string[])
	: Promise<IContainerInfo[]> => {
		const {
			containersToRemove,
			containersToStart
		} = status
		if (containersToStart !== 0 && containersToRemove !== 0) {
			throw new Error("invalid status: cannot start and kill containers in one call")
		}
		const createPromises: Promise<IContainerInfo>[] = []
		if (containersToStart) {
			for (let i = 0; i < containersToStart; i++) {
				createPromises.push(this.dockerService.createContainer())
			}
		}
		const removePromises: Promise<IContainerInfo>[] = []
		if (containersToRemove && idleContainerIds) {
			const idleContainersToKill = idleContainerIds.slice(0, containersToRemove)
			idleContainersToKill.forEach(idleContainer =>
				removePromises.push(this.dockerService.removeContainer(idleContainer)))
		}
		this.logger.info(`creating ${createPromises.length}/removing ${removePromises.length} containers`)
		return await Promise.all([...createPromises, ...removePromises])
	}
	public checkContainerStatus = async (
		pendingRequests: number
	) : Promise<IContainerStatus> => {
		const containerInfo = await this.dockerService.getRunningContainerInfo()
		const containerCount = containerInfo.length
		const {
			containerStartThreshold,
			maxContainers
		} = this.config
		const hasFreeContainers = containerCount < maxContainers
		const shouldStartContainer = pendingRequests >= containerStartThreshold
		let containersToStart = 0
		if (hasFreeContainers && shouldStartContainer) {
			// Determine number of containers to start
			containersToStart = maxContainers - containerCount
		}
		let containersToRemove = 0
		// This doesn't make sense so far
		// Since we need to know which containers we can remove
		if (pendingRequests < containerCount) {
			containersToRemove = containerCount - pendingRequests
		}
		return {
			containersToRemove,
			containersToStart,
			pendingRequests,
			runningContainers: containerInfo
		}
	}
}