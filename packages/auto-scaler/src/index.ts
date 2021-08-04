import { DockerService } from "./docker"
import { IAutoScalerConfiguration } from "./config"
import { IContainerInfo } from "./docker/interface"
import { IContainerStatus } from "./interface"
export class AutoScaler {
	private readonly config: IAutoScalerConfiguration
	private readonly dockerService: DockerService
	constructor(config: IAutoScalerConfiguration) {
		this.config = config
		const {
			dockerConfig
		} = this.config
		this.dockerService = new DockerService(dockerConfig)
	}
	public applyConfigurationState = async (status: IContainerStatus, idleContainerIds?: string[])
	: Promise<IContainerInfo[]> => {
		const {
			containersToKill,
			containersToStart
		} = status
		if (containersToStart !== 0 && containersToKill !== 0) {
			throw new Error("invalid status: cannot start and kill containers in one call")
		}
		const promises = []
		if (containersToStart) {
			for (let i = 0; i < containersToStart; i++) {
				promises.push(this.dockerService.createContainer())
			}
		}
		if (containersToKill && idleContainerIds) {
			const idleContainersToKill = idleContainerIds.slice(0, containersToKill)
			idleContainersToKill.forEach(idleContainer =>
				promises.push(this.dockerService.removeContainer(idleContainer)))
		}
		return await Promise.all(promises)
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
		let containersToKill = 0
		// This doesn't make sense so far
		// Since we need to know which containers we can remove
		if (pendingRequests < containerCount) {
			containersToKill = containerCount - pendingRequests
		}
		return {
			containersToKill,
			containersToStart,
			pendingRequests,
			runningContainers: containerInfo
		}
	}
}