import { DockerService } from "./docker"
import { IAutoScalerConfiguration } from "./config"
import {
	IComputedScalingResult,
	IContainerStateChange,
	IContainerStatus
} from "./interface"
import { IContainerInfo } from "./docker/interface"
import { Logger } from "logger/src/index"
export class AutoScaler {
	private readonly config: IAutoScalerConfiguration
	private readonly dockerService: DockerService
	private readonly logger: Logger
	constructor(config: IAutoScalerConfiguration) {
		this.config = config
		const {
			dockerConfig
		} = this.config
		this.logger = new Logger({
			fileOnly: "autoscaler.log",
			serviceName: "auto-scaler"
		})
		this.dockerService = new DockerService(dockerConfig, this.logger)
	}
	public applyConfigurationState = async (
		status: IContainerStatus,
		idleContainerIds?: string[],
		imageId?: string,
		tag?: string
	): Promise<IContainerStateChange> => {
		const {
			containersToRemove,
			containersToStart
		} = status
		if (containersToStart !== 0 && containersToRemove !== 0) {
			throw new Error("invalid status: cannot start and kill containers in one call")
		}
		const startedContainers: IContainerInfo[] = []
		if (containersToStart > 0) {
			const promises: Promise<IContainerInfo>[] = []
			for (let i = 0; i < containersToStart; i++) {
				const createContainerPromise = async (): Promise<IContainerInfo> => {
					return this.dockerService.createContainer(imageId, tag)
				}
				promises.push(createContainerPromise())
			}
			const containerInfos = await Promise.all(promises)
			startedContainers.push(...containerInfos)
		}
		const removedContainers: IContainerInfo[] = []
		if (containersToRemove > 0 && idleContainerIds) {
			const idleContainersToRemove = idleContainerIds.slice(0, containersToRemove)
			const promises: Promise<IContainerInfo>[] = []
			for (let i = 0; i < idleContainersToRemove.length; i++) {
				const removeContainerPromise = async (): Promise<IContainerInfo> => {
					return await this.dockerService.removeContainer(idleContainersToRemove[i])
				}
				promises.push(removeContainerPromise())
			}
			const containerInfos = await Promise.all(promises)
			removedContainers.push(...containerInfos)
		}
		return {
			removedContainers,
			startedContainers
		}
	}
	public checkContainerStatus = async (
		pendingRequests: number
	) : Promise<IContainerStatus> => {
		const containerInfo = await this.dockerService.getRunningContainerInfo()
		const runningContainers = containerInfo.length
		const {
			tasksPerContainer,
			maxContainers,
			minContainers
		} = this.config
		const {
			start, remove
		} = this.computeContainerScaleAmount(
			runningContainers,
			pendingRequests,
			tasksPerContainer,
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
		/* Nothing to do here */
		if (pendingRequests === 0 && runningContainers === 0) {
			return {
				remove: 0,
				start: minContainers
			}
		}
		if (pendingRequests === 0) {
			if (runningContainers < minContainers) {
				return {
					remove: 0,
					start: minContainers - runningContainers
				}
			}
			else if (runningContainers > minContainers) {
				return {
					remove: runningContainers - minContainers,
					start: 0
				}
			}
			else {
				return {
					remove: 0,
					start: 0
				}
			}
		}
		/* Early exit and avoid division by zero */
		if (runningContainers === 0) {
			return {
				remove: 0,
				start: Math.min(
					Math.ceil(pendingRequests / tasksPerContainer),
					maxContainers
				)
			}
		}
		let start = 0
		let remove = 0
		const pendingTasksPerContainer = Math.ceil(pendingRequests / runningContainers)
		/* If we exceed the task per container threshold */
		if (pendingTasksPerContainer > tasksPerContainer) {
			/*
			 * Compute required amount of containers for tasks not being
			 * handled by already running containers
			 */
			const remainingTasks = pendingRequests - tasksPerContainer * runningContainers
			start = Math.ceil(remainingTasks / tasksPerContainer)
			if (start + runningContainers > maxContainers) {
				/* Do not exceed upper threshold */
				start = maxContainers - runningContainers
			}
		}
		else if (pendingTasksPerContainer < tasksPerContainer) {
			/* Container amount we need to handle the actual amount of all requests */
			const requiredContainers = Math.max(
				pendingRequests - tasksPerContainer * runningContainers,
				0
			)
			/* Containers we can remove */
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
	public readonly removeContainer = async (containerId: string): Promise<IContainerInfo> => {
		return await this.dockerService.removeContainer(containerId)
	}
}