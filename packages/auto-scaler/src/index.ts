import { DockerService } from "./docker"
import { IAutoScalerConfiguration } from "./config"
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
	public applyConfigurationState = async () : Promise<void> => {
		// TODO: implement
	}
	public checkContainerStatus = async (
		pendingRequests: number
	) : Promise<IContainerStatus | undefined> => {
		try {
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
			return {
				containersToStart,
				pendingRequests,
				runningContainers: containerCount
			}
		}
		catch (error) {
			// TODO: error handling
		}
		return undefined
	}
}