import { AutoScaler } from "auto-scaler"
import {
	ConversionFormatsApiFactory,
	IApiConversionFormatResponse,
	MiscApiFactory
} from "./api/conversion-client"
import {
	IContainerCheck,
	IConversionRequest,
	IWorkerInfo
} from "./interface"
import { IContainerStateChange, IContainerStatus } from "auto-scaler/src/interface"
import {
	IRedisServiceConfiguration,
	getRedisConfigFromEnv
} from "./config"
import { InvalidWorkerIdError } from "./exception"
import { Logger } from "logger"
import { RedisWrapper } from "./wrapper"
export class RedisService {
	/**
	 * The auto-scaler component managing the docker containers.
	 */
	private readonly autoScaler: AutoScaler
	/**
	 * A cache of supported formats for the workers.
	 */
	private cachedFormats: IApiConversionFormatResponse | null = null
	/**
	 * The configuration of redis-service containing environment variables.
	 */
	private readonly config: IRedisServiceConfiguration
	/**
	 * The most recent container status.
	 */
	private lastStatus: IContainerStatus | null = null
	/**
	 * The redis-service logger.
	 */
	private readonly logger: Logger
	/**
	 * The wrapper around the rsmq implementation.
	 */
	private readonly redisWrapper: RedisWrapper
	/**
	 * The map of currently running containers.
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
	 * Apply the last status.
	 * Should only be called after calling checkHealth.
	 */
	readonly applyState = async (): Promise<void> => {
		if (this.lastStatus !== null) {
			const result = await this.autoScaler.applyConfigurationState(
				this.lastStatus,
				this.getIdleWorkerIds()
			)
			await this.updateActiveWorkers(result)
		}
	}
	/**
	 * Check the current container status.
	 */
	readonly checkHealth = async (): Promise<void> => {
		const pendingRequests = await this.redisWrapper.getPendingMessagesCount()
		this.lastStatus = await this.autoScaler.checkContainerStatus(pendingRequests)
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
	 * Get the supported formats of the workers.
	 * The first call will ask every worker, return the first response
	 * and cache it since it will not change.
	 * @returns the supported formats of the workers.
	 */
	readonly getFormats = async (): Promise<IApiConversionFormatResponse> => {
		if (this.cachedFormats !== null) {
			this.logger.info("using cached formats")
			return this.cachedFormats
		}
		this.logger.info("fetching formats from workers")
		const formats = await Promise.any(this.getWorkerIps().map(async ip => {
			return ConversionFormatsApiFactory(undefined, `http://${ip}:3000`)
				.getSupportedConversionFormats()
				.then(r => r.data)
				.catch(this.logger.error)
		}))
		if (formats) {
			this.cachedFormats = formats
			return this.cachedFormats
		}
		else {
			// This has a really, really low change of happening so
			// A custom error is not required
			throw new Error("no worker replied with formats")
		}
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
	 * Ping the first available worker.
	 */
	readonly pingRandomWorker = async (): Promise<boolean> => {
		const containerIps: string[] = []
		this.runningWorkers.forEach(workerInfo =>
			containerIps.push(workerInfo.containerInfo.containerIp))
		const promises = containerIps.map(async ip => this.pingWorker(ip))
		const result = await Promise.all(promises)
		return result.filter(res => res).length > 0
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
		this.logger.info("Commencing redis-service cleanup")
		await this.redisWrapper.quit()
		const {
			runningContainers
		} = await this.autoScaler.checkContainerStatus(0)
		const {
			removedContainers
		} = await this.autoScaler.applyConfigurationState({
			containersToRemove: runningContainers.length,
			containersToStart: 0,
			pendingRequests: 0,
			runningContainers
		}, runningContainers.map(runningContainer => runningContainer.containerId))
		this.logger.info(`Removed ${removedContainers.length} containers`)
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
	 * Get the docker-container ip's.
	 * @returns the ip's of the workers
	 */
	private readonly getWorkerIps = (): string[] => {
		const workerIps: string[] = []
		this.runningWorkers.forEach(workerInfo => {
			const {
				containerIp
			} = workerInfo.containerInfo
			workerIps.push(containerIp)
		})
		return workerIps
	}
	/**
	 * Ping the given worker via IP.
	 * Retries are primarily used for when the worker container
	 * was just started and isn't ready yet.
	 * @param containerIp the ip of the worker to ping
	 * @param retries the number of retries (default = 0)
	 * @returns true if the worker replied 'pong', false otherwise
	 */
	private readonly pingWorker = async (containerIp: string, retries: number = 0)
	: Promise<boolean> => {
		const retryDelay = 2000
		const baseUrl = `http://${containerIp}:3000`
		let isRunning = false
		for (let i = 0; i <= retries; i++) {
			this.logger.info(`pinging ${baseUrl} (Attempt: ${i})`)
			try {
				// eslint-disable-next-line no-await-in-loop
				const resp = await MiscApiFactory(undefined, baseUrl)
					.getPingResponse()
					.then(r => r.data)
				if (resp === "pong") {
					this.logger.info(`${containerIp} replied pong`)
					isRunning = true
					break
				}
			}
			catch (error) {
				// This.logger.error(error)
				// eslint-disable-next-line no-await-in-loop
				await new Promise((resolve, reject) => setTimeout(resolve, retryDelay))
				continue
			}
		}
		return isRunning
	}
	/**
	 * Update the running workers. Remove stopped containers.
	 * Ping started containers and stop them if they do not reply
	 * after 3 retries.
	 * @param IContainerStateChange the result of applying the new container state
	 */
	private readonly updateActiveWorkers = async ({
		removedContainers,
		startedContainers
	}: IContainerStateChange): Promise<void> => {
		// Remove removed containers
		removedContainers.forEach(container =>
			this.runningWorkers.delete(container.containerId))
		const containerChecks:IContainerCheck[] = []
		// Only retry pinging a container 3 times
		const maxAttempts = 3
		for (const startedContainer of startedContainers) {
			const {
				containerIp
			} = startedContainer
			// eslint-disable-next-line no-await-in-loop
			const isRunning = await this.pingWorker(containerIp, maxAttempts)
			containerChecks.push({
				containerInfo: startedContainer,
				isRunning
			})
		}
		const runningContainers = containerChecks
			.filter(check => check.isRunning)
		runningContainers.forEach(containerCheck => {
			const {
				containerId,
				containerName
			} = containerCheck.containerInfo
			this.runningWorkers.set(
				containerId,
				{
					containerInfo: containerCheck.containerInfo,
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