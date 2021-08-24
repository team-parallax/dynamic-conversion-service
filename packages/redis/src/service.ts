import { AutoScaler } from "auto-scaler"
import {
	IContainerCheck,
	IConversionRequest,
	IWorkerInfo
} from "./interface"
import { IContainerStateChange } from "auto-scaler/src/interface"
import { IRedisServiceConfiguration, getRedisConfigFromEnv } from "./config"
import { InvalidWorkerIdError } from "./exception"
import { Logger } from "logger"
import { RedisWrapper } from "./wrapper"
export class RedisService {
	/**
	 * The auto-scaler component managing the docker containers.
	 */
	private readonly autoScaler: AutoScaler
	/**
	 * The configuration of redis-service containing environment variables.
	 */
	private readonly config: IRedisServiceConfiguration
	/**
	 * The redis-service logger.
	 */
	private readonly logger: Logger
	/**
	 * The wrapper around the rsmq implementation.
	 */
	private readonly redisWrapper: RedisWrapper
	/**
	 * The map of currently running containers
	 */
	private readonly runningWorkers: Map<string, IWorkerInfo>
	constructor() {
		this.config = getRedisConfigFromEnv()
		this.logger = new Logger({
			serviceName: "redis-service"
		})
		const {
			autoScalerConfig,
			redisConfig
		} = this.config
		this.redisWrapper = new RedisWrapper(redisConfig, this.logger)
		this.autoScaler = new AutoScaler(autoScalerConfig)
		this.runningWorkers = new Map()
	}
	/**
	 * Add the given request to the queue to be processed later.
	 * @param conversionRequest request to add to the queue
	 */
	readonly addRequestToQueue = async (conversionRequest: IConversionRequest): Promise<void> => {
		await this.redisWrapper.sendMessage(JSON.stringify(conversionRequest))
	}
	/**
	 * Check the current container status and apply any required scaling.
	 */
	readonly checkHealth = async (): Promise<void> => {
		const pendingRequests = await this.redisWrapper.getPendingMessagesCount()
		const containerStatus = await this.autoScaler.checkContainerStatus(pendingRequests)
		const result = await this.autoScaler.applyConfigurationState(
			containerStatus,
			this.getIdleWorkerIds()
		)
		await this.updateActiveWorkers(result)
	}
	/**
	 * Get the current conversion request for the given conversion id.
	 * @param conversionId the conversion id to look for
	 * @returns the current request of the conversion id, undefined if theres
	 * no conversion with the given id
	 */
	readonly getConversionResult = (conversionId: string): IConversionRequest | undefined => {
		let conversionRequest: IConversionRequest | undefined = undefined
		this.runningWorkers.forEach(workerInfo => {
			if (workerInfo.currentRequest !== null) {
				if (workerInfo.currentRequest.conversionId === conversionId) {
					conversionRequest = workerInfo.currentRequest
				}
			}
		})
		return conversionRequest
	}
	/**
	 * Get the number of pending requests within the queue.
	 * @returns The number of pending requests in the queue
	 */
	readonly getPendingRequestCount = async (): Promise<number> => {
		return this.redisWrapper.getPendingMessagesCount()
	}
	/**
	 * Get all currently running workers and their info.
	 * @returns all currently runniung workers
	 */
	readonly getQueueStatus = (): IWorkerInfo[] => {
		const workerInfos: IWorkerInfo[] = []
		this.runningWorkers.forEach(workerInfo => {
			workerInfos.push(workerInfo)
		})
		return workerInfos
	}
	/**
	 * Initialize redis service.
	 */
	readonly initalize = async (): Promise<void> => {
		await this.redisWrapper.initialize()
	}
	/**
	 * Retrieve a request from the queue.
	 * @returns a request from the queue
	 */
	readonly popRequest = async (): Promise<IConversionRequest> => {
		const requestString = await this.redisWrapper.receiveMessage()
		const conversionRequest = JSON.parse(requestString) as IConversionRequest
		return conversionRequest
	}
	/**
	 * Clean-up and quit the redis-service.
	 */
	readonly quit = async (): Promise<void> => {
		await this.redisWrapper.quit()
	}
	/**
	 * Get the docker-container id's of idle workers.
	 * @returns the container id's of idle workers
	 */
	private readonly getIdleWorkerIds = (): string[] => {
		const idleContainers: string[] = []
		this.runningWorkers.forEach((containerInfo, containerID) => {
			if (containerInfo.currentRequest === null) {
				idleContainers.push(containerID)
			}
		})
		return idleContainers
	}
	/**
	 *
	 * @param worker
	 * @returns
	 */
	private readonly pingWorker = async (worker: any): Promise<boolean> => {
		// Worker.ping
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		await new Promise((resolve, reject) => setTimeout(resolve, 100))
		return true
	}
	/**
	 *
	 * @param param0
	 */
	private readonly updateActiveWorkers = async ({
		removedContainers,
		startedContainers
	}: IContainerStateChange): Promise<void> => {
		removedContainers.forEach(container =>
			this.runningWorkers.delete(container.containerId))
		const pingChecks = startedContainers.map(
			async (container): Promise<IContainerCheck> => ({
				containerInfo: container,
				isRunning: await this.pingWorker(container)
			})
		)
		const containerChecks = await Promise.all(pingChecks)
		const runningContainers = containerChecks
			.filter(check => check.isRunning)
		runningContainers.forEach(containerCheck => {
			const {
				containerInfo
			} = containerCheck
			const {
				containerId,
				containerName
			} = containerInfo
			this.runningWorkers.set(
				containerId,
				{
					containerInfo,
					currentRequest: null,
					workerUrl: `/${containerName}/`
				}
			)
		})
		const nonRunningContainerIds = containerChecks
			.filter(check => !check.isRunning)
			.map(container => container.containerInfo.containerId)
		const removePromises = nonRunningContainerIds.map(
			async id => this.autoScaler.removeContainer(id)
		)
		await Promise.all(removePromises)
	}
	/**
	 *
	 * @param workerId
	 * @param conversionRequest
	 */
	private readonly updateWorkerConversionStatus = (
		workerId: string,
		conversionRequest: IConversionRequest | null
	): void => {
		let workerInfo = this.runningWorkers.get(workerId)
		if (!workerInfo) {
			throw new InvalidWorkerIdError(workerId)
		}
		workerInfo = {
			...workerInfo,
			currentRequest: conversionRequest
		}
		this.runningWorkers.set(workerId, workerInfo)
	}
}