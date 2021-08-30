/* eslint-disable no-await-in-loop */
import { AutoScaler } from "auto-scaler"
import {
	EConversionStatus,
	IApiConversionFormatResponse
} from "./api/conversion-client"
import {
	IContainerStateChange,
	IContainerStatus
} from "auto-scaler/src/interface"
import {
	IConversionRequest,
	IFinishedRequest,
	IWorkerInfo
} from "./interface"
import {
	IRedisServiceConfiguration,
	getRedisConfigFromEnv
} from "./config"
import { InvalidWorkerIdError } from "./exception"
import { Logger } from "logger"
import { RedisWrapper } from "./wrapper"
import { deleteFile } from "conversion-service/src/service/file-io"
import {
	forwardRequestToWorker,
	getConversionStatus,
	getExtFromFormat,
	getFileFromWorker,
	getFormatsFromWorker,
	pingWorker
} from "./util"
import { isFinished } from "./api/rest/conversion/util"
import { join } from "path"
import { performance } from "perf_hooks"
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
	 * The map of finished requests.
	 */
	private readonly finishedRequest: Map<string, IFinishedRequest>
	/**
	 * The most recent container status.
	 */
	private lastStatus: IContainerStatus | null = null
	/**
	 * The redis-service logger.
	 */
	private readonly logger: Logger
	/**
	 * The reference to interval loop.
	 */
	private probeInterval: NodeJS.Timeout | null = null
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
		this.finishedRequest = new Map()
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
			const started = result.startedContainers.length
			const removed = result.removedContainers.length
			this.logger.info(`Scaling: started ${started}/killed ${removed}`)
			this.lastStatus = null
			this.updateActiveWorkers(result)
		}
	}
	/**
	 * Check the current container status.
	 */
	readonly checkHealth = async (): Promise<void> => {
		const pendingRequests = await this.redisWrapper.getPendingMessagesCount()
		const status = await this.autoScaler.checkContainerStatus(pendingRequests)
		const unhealthyContainerIds = status.runningContainers
			.filter(con => {
				const {
					containerStatus
				} = con
				return containerStatus.includes("unhealthy")
				|| containerStatus.includes("Exited")
			})
			.map(container => container.containerId)
		const unhealthyContainerCount = unhealthyContainerIds.length
		if (unhealthyContainerCount > 0) {
			this.logger.info(`found ${unhealthyContainerCount} unhealthy containers`)
			for (const containerId of unhealthyContainerIds) {
				await this.autoScaler.removeContainer(containerId)
				this.runningWorkers.delete(containerId)
			}
			this.logger.info(`removed ${unhealthyContainerCount} unhealthy containers`)
		}
		this.lastStatus = await this.autoScaler.checkContainerStatus(pendingRequests)
		const {
			containersToRemove,
			containersToStart
		} = this.lastStatus
		this.logger.info(`Health-Check: Up:${containersToStart}/Down:${containersToRemove}`)
	}
	/**
	 * Get the current conversion request for the given conversion id.
	 * @param conversionId the conversion id to look for
	 * @returns the current request of the conversion id, undefined if theres
	 * no conversion with the given id
	 */
	readonly getConversionResult = (conversionId: string): IConversionRequest | undefined => {
		if (this.finishedRequest.has(conversionId)) {
			return this.finishedRequest.get(conversionId)?.request
		}
		let conversionRequest: IConversionRequest | undefined = undefined
		this.runningWorkers.forEach(workerInfo => {
			if (workerInfo.currentRequest !== null) {
				if (workerInfo.currentRequest.externalConversionId === conversionId) {
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
		const [workerUrl] = this.getWorkerUrls()
		const formats = await getFormatsFromWorker(workerUrl)
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
	readonly getWorkers = (): IWorkerInfo[] => {
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
		const workerUrls: string[] = []
		this.runningWorkers.forEach(workerInfo =>
			workerUrls.push(workerInfo.workerUrl))
		const promises = workerUrls.map(async url => pingWorker(url))
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
		if (this.probeInterval !== null) {
			clearInterval(this.probeInterval)
		}
		this.logger.info("stopped queue check cron job")
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
	 * Start the queue and health check cron jobs.
	 */
	readonly start = (): void => {
		this.logger.info("Starting intervals")
		const ms = 1000
		// Every 5 seconds
		const queueProbeInterval = 10
		// Convert to ms
		const {
			healthCheckInterval,
			stateApplicationInterval
		} = this.config.schedulerConfig
		// To ensure data consitency we run everything in the same interval
		// Compute how many normal probes we need until the specified
		// Time for a state apply has elapsed.
		const probesPerStateApply = Math.ceil(stateApplicationInterval / queueProbeInterval)
		let probeCount = 1
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		this.probeInterval = setInterval(async (): Promise<void> => {
			const probeStart = performance.now()
			// Checking for dead containers
			await this.checkHealth()
			// Forwarding requests to workers
			await this.forwardRequestsToIdleWorkers()
			// Probe and update worker conversion status
			await this.probeWorkersForStatus()
			// Fetch files
			await this.fetchFilesFromWorkers()
			if (probeCount % probesPerStateApply === 0) {
				await this.applyState()
			}
			probeCount++
			const probeDuration = performance.now() - probeStart
			this.logger.info(`probe took ${Number(probeDuration).toFixed(0)}ms`)
		}, healthCheckInterval * ms)
	}
	/**
	 * Fetch the files from workers where the conversion succeeded and
	 * remove the request from the worker.
	 * THIS IS A LIFECYLCE METHOD AND SHOULD ONLY BE CALLED FROM WITHIN THE INTERVAL!!!
	 */
	private readonly fetchFilesFromWorkers = async (): Promise<void> => {
		const finishedWorkers = this.getWorkers().filter(worker =>
			isFinished(worker.currentRequest?.conversionStatus))
		for (const worker of finishedWorkers) {
			if (worker.currentRequest !== null) {
				const {
					currentRequest,
					workerUrl
				} = worker
				const {
					externalConversionId,
					workerConversionId
				} = currentRequest
				const {
					originalFormat,
					targetFormat
				} = currentRequest.conversionRequestBody
				const {
					containerName,
					containerId
				} = worker.containerInfo
				if (currentRequest.conversionStatus === "converted") {
					await getFileFromWorker(
						workerUrl,
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						workerConversionId!,
						externalConversionId,
						targetFormat
					)
					this.logger.info(`fetched result from ${containerName}`)
					this.finishedRequest.set(
						externalConversionId,
						{
							containerId,
							request: currentRequest
						}
					)
				}
				else if (currentRequest.conversionStatus === "erroneous") {
					this.finishedRequest.set(
						externalConversionId,
						{
							containerId,
							request: currentRequest
						}
					)
				}
				this.updateWorkerConversionStatus(containerId, null)
				const ext = getExtFromFormat(originalFormat)
				const inputPath = join("input", externalConversionId + ext)
				await deleteFile(inputPath)
				this.logger.info(`deleted  ${inputPath}`)
			}
		}
	}
	/**
	 * Dispatch requests from the queue to idle workers.
	 * THIS IS A LIFECYLCE METHOD AND SHOULD ONLY BE CALLED FROM WITHIN THE INTERVAL!!!
	 */
	private readonly forwardRequestsToIdleWorkers = async (): Promise<void> => {
		const idleWorkerContainerIds = this.getIdleWorkerIds()
		const forwardableRequests: IConversionRequest[] = []
		// Retrieve as many requests as we can handle right now
		while (
			await this.getPendingRequestCount() > 0
				&& forwardableRequests.length < idleWorkerContainerIds.length
		) {
			forwardableRequests.push(await this.popRequest())
		}
		for (let i = 0; i < forwardableRequests.length; i++) {
			const workerId = idleWorkerContainerIds[i]
			const worker = this.runningWorkers.get(workerId)
			if (!worker) {
				throw new InvalidWorkerIdError(workerId)
			}
			const request = forwardableRequests[i]
			const {
				containerName
			} = worker.containerInfo
			const workerConversionId = await forwardRequestToWorker(worker.workerUrl, request)
			this.updateWorkerConversionStatus(workerId, {
				...request,
				conversionStatus: EConversionStatus.Processing,
				workerConversionId
			})
			this.logger.info(`forwarded request ${request.externalConversionId} to ${containerName}`)
		}
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
	private readonly getWorkerUrls = (): string[] => {
		const workerUrls: string[] = []
		this.runningWorkers.forEach(workerInfo => {
			workerUrls.push(workerInfo.workerUrl)
		})
		return workerUrls
	}
	/**
	 * Probe all busy workers for their status.
	 * THIS IS A LIFECYLCE METHOD AND SHOULD ONLY BE CALLED FROM WITHIN THE INTERVAL!!!
	 */
	private readonly probeWorkersForStatus = async (): Promise<void> => {
		const probeWorkers = this.getWorkers().filter(worker => worker.currentRequest !== null)
		for (const worker of probeWorkers) {
			if (worker.currentRequest !== null) {
				if (worker.currentRequest.workerConversionId !== null) {
					const {
						workerUrl,
						currentRequest
					} = worker
					const {
						containerId,
						containerName
					} = worker.containerInfo
					const {
						workerConversionId
					} = worker.currentRequest
					const status = await getConversionStatus(workerUrl, workerConversionId)
					this.updateWorkerConversionStatus(
						containerId,
						{
							...currentRequest,
							conversionStatus: status
						}
					)
					this.logger.info(`[${containerName}]: ${status}`)
				}
			}
		}
	}
	/**
	 * Update the running workers. Remove stopped containers.
	 * Ping started containers and stop them if they do not reply
	 * after 3 retries.
	 * @param IContainerStateChange the result of applying the new container state
	 */
	private readonly updateActiveWorkers = ({
		removedContainers,
		startedContainers
	}: IContainerStateChange): void => {
		removedContainers.forEach(container => this.runningWorkers.delete(container.containerId))
		startedContainers.forEach(container =>
			this.runningWorkers.set(
				container.containerId,
				{
					containerInfo: container,
					currentRequest: null,
					workerUrl: `http://${container.containerIp}:3000`
				}
			))
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
		if (conversionRequest === null) {
			this.logger.info(`${workerInfo.containerInfo.containerName} is now idle`)
		}
	}
}