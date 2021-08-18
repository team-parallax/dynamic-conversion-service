import { AutoScaler } from "auto-scaler"
import {
	IContainerCheck, IConversionRequest, IWorkerInfo
} from "./interface"
import { IContainerStateChange } from "auto-scaler/src/interface"
import { IRedisServiceConfiguration, getRedisConfigFromEnv } from "./config"
import { InvalidWorkerIdError } from "./exception"
import { Logger } from "../../logger"
import { RedisWrapper } from "./wrapper"
export class RedisService {
	private readonly autoScaler: AutoScaler
	private readonly config: IRedisServiceConfiguration
	private readonly logger: Logger
	private readonly redisWrapper: RedisWrapper
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
	readonly addRequestToQueue = async (conversionRequest: IConversionRequest): Promise<void> => {
		await this.redisWrapper.sendMessage(JSON.stringify(conversionRequest))
	}
	readonly checkHealth = async (): Promise<void> => {
		const pendingRequests = await this.redisWrapper.getPendingMessagesCount()
		const containerStatus = await this.autoScaler.checkContainerStatus(pendingRequests)
		const result = await this.autoScaler.applyConfigurationState(
			containerStatus,
			this.getIdleWorkerIds()
		)
		await this.updateActiveWorkers(result)
	}
	readonly getPendingRequestCount = async (): Promise<number> => {
		return this.redisWrapper.getPendingMessagesCount()
	}
	readonly initalize = async (): Promise<void> => {
		await this.redisWrapper.initialize()
	}
	readonly popRequest = async (): Promise<IConversionRequest> => {
		const requestString = await this.redisWrapper.receiveMessage()
		const conversionRequest = JSON.parse(requestString) as IConversionRequest
		return conversionRequest
	}
	readonly quit = async (): Promise<void> => {
		await this.redisWrapper.quit()
	}
	private readonly getIdleWorkerIds = (): string[] => {
		const idleContainers: string[] = []
		this.runningWorkers.forEach((containerInfo, containerID) => {
			if (containerInfo.currentRequest === null) {
				idleContainers.push(containerID)
			}
		})
		return idleContainers
	}
	private readonly pingWorker = async (worker: any): Promise<boolean> => {
		// Worker.ping
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		await new Promise((resolve, reject) => setTimeout(resolve, 100))
		return true
	}
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
					dockerNetworkBaseURL: `/${containerName}/`
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