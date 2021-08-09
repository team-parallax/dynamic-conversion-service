import { DockerService } from "./docker"
import { IAutoScalerConfiguration } from "./config"
import { IComputedScalingResult, IContainerStatus } from "./interface"
import { IContainerInfo } from "./docker/interface"
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
		const containerInfos: IContainerInfo[] = []
		this.logger.info(`creating ${containersToStart}/removing ${containersToRemove} containers`)
		if (containersToStart) {
			for (let i = 0; i < containersToStart; i++) {
				// eslint-disable-next-line no-await-in-loop
				const containerInfo = await this.dockerService.createContainer()
				containerInfos.push(containerInfo)
			}
		}
		if (containersToRemove && idleContainerIds) {
			const idleContainersToRemove = idleContainerIds.slice(0, containersToRemove)
			for (let i = 0; i < idleContainersToRemove.length; i++) {
				// eslint-disable-next-line no-await-in-loop
				const containerInfo = await this.dockerService
					.removeContainer(idleContainersToRemove[i])
				containerInfos.push(containerInfo)
			}
		}
		return containerInfos
	}
	public checkContainerStatus = async (
		pendingRequests: number
	) : Promise<IContainerStatus> => {
		const containerInfo = await this.dockerService.getRunningContainerInfo()
		const runningContainers = containerInfo.length
		const {
			containerStartThreshold,
			maxContainers,
			minContainers
		} = this.config
		const {
			start, remove
		} = this.computeContainerScaleAmount(
			runningContainers,
			pendingRequests,
			containerStartThreshold,
			maxContainers,
			minContainers
		)
		return {
			containersToRemove: remove,
			containersToStart: start,
			pendingRequests,
			runningContainers: containerInfo
		}
	}
	public readonly computeContainerScaleAmount = (
		runningContainers: number,
		pendingRequests: number,
		tasksPerContainer: number,
		maxContainers: number,
		minContainers: number
	): IComputedScalingResult => {
		// Nothing to do here
		if (pendingRequests === 0) {
			return {
				remove: 0,
				start: 0
			}
		}
		// Early exit and avoid division by zero
		if (runningContainers === 0) {
			return {
				remove: 0,
				start: Math.ceil(pendingRequests / tasksPerContainer)
			}
		}
		let start = 0
		let remove = 0
		const pendingTasksPerContainer = Math.ceil(pendingRequests / runningContainers)
		// If we exceed the task per container threshold
		if (pendingTasksPerContainer > tasksPerContainer) {
			// Compute required amount of containers for tasks not being
			// Handled by running containers
			const remainingTasks = pendingRequests - tasksPerContainer * runningContainers
			start = Math.ceil(remainingTasks / tasksPerContainer)
			if (start + runningContainers > maxContainers) {
				// Do not exceed upper threshold
				start = maxContainers - runningContainers
			}
		}
		else if (pendingTasksPerContainer < tasksPerContainer) {
			// Tasks we actually need for all requests
			const requiredContainers = Math.max(
				pendingRequests - tasksPerContainer * runningContainers,
				0
			)
			// Containers we can remove
			remove = runningContainers - requiredContainers
			remove = Math.max(
				runningContainers - remove,
				runningContainers - requiredContainers - minContainers
			)
		}
		return {
			remove,
			start
		}
	}
}