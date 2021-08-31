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
	IWorkerInfo,
	IWorkers
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
	isHealthy,
	isUnhealthy,
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
	 * The object to track currently running workers.
	 */
	private readonly workers: IWorkers
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
		this.workers = {}
		this.finishedRequest = new Map()
	}
	/**
	 * Add the given request to the queue to be processed later.
	 * @param conversionRequest request to add to the queue
	 */
	readonly addRequestToQueue = async (conversionRequest: IConversionRequest): Promise<void> => {
		await this.redisWrapper.sendMessage(JSON.stringify(conversionRequest))
		const queueDepth = await this.getPendingRequestCount()
		this.logger.info(`added request to queue [${queueDepth}]`)
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
			this.logger.info(`STATE: started ${started} | removed ${removed} containers`)
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
		status.runningContainers.forEach(container => {
			const {
				containerIp,
				containerName,
				containerStatus
			} = container
			this.logger.info(`[STATUS]: ${containerName} => ${containerStatus} ${containerIp}`)
		})
		const unhealthyContainerIds = status.runningContainers
			.filter(con => isUnhealthy(con.containerStatus))
			.map(container => container.containerId)
		const unhealthyContainerCount = unhealthyContainerIds.length
		if (unhealthyContainerCount > 0) {
			this.logger.info(`found ${unhealthyContainerCount} unhealthy containers`)
			for (const containerId of unhealthyContainerIds) {
				await this.autoScaler.removeContainer(containerId)
				delete this.workers[containerId]
			}
			this.logger.info(`removed ${unhealthyContainerCount} unhealthy containers`)
		}
		this.lastStatus = await this.autoScaler.checkContainerStatus(pendingRequests)
		const {
			containersToRemove: remove,
			containersToStart: start
		} = this.lastStatus
		this.lastStatus.runningContainers.forEach(container => {
			if (!this.workers[container.containerId]) {
				throw new InvalidWorkerIdError(container.containerId)
			}
			this.workers[container.containerId] = {
				...this.workers[container.containerId],
				containerInfo: container
			}
		})
		this.logger.info(`HEALTH: should start ${start} | remove ${remove} containers`)
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
		let conversionRequest: IConversionRequest | null = null
		Object.keys(this.workers).forEach(workerId => {
			if (this.workers[workerId].currentRequest !== null) {
				if (this.workers[workerId].currentRequest?.externalConversionId === conversionId) {
					conversionRequest = this.workers[workerId].currentRequest
				}
			}
		})
		return conversionRequest === null
			? undefined
			: conversionRequest
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
		return Object.keys(this.workers).map(workerId => this.workers[workerId])
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
		const workerUrls = Object.keys(this.workers)
			.map(workerId => this.workers[workerId].workerUrl)
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
		await this.autoScaler.applyConfigurationState({
			containersToRemove: runningContainers.length,
			containersToStart: 0,
			pendingRequests: 0,
			runningContainers
		}, runningContainers.map(runningContainer => runningContainer.containerId))
	}
	/**
	 * Start the queue and health check cron jobs.
	 */
	readonly start = async (): Promise<void> => {
		this.logger.info("starting main loop")
		await this.checkHealth()
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
			const shouldApplyState = probeCount % probesPerStateApply === 0
			// eslint-disable-next-line multiline-ternary
			const loggerPrefix = shouldApplyState ? "[HEALTH+STATE]" : "[HEALTH]"
			this.logger.info(`${loggerPrefix}: #${probeCount}`)
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
			this.logger.info(`${loggerPrefix}: ${Number(probeDuration).toFixed(0)}ms`)
		}, healthCheckInterval * ms)
	}
	/**
	 * Fetch the files from workers where the conversion succeeded and
	 * remove the request from the worker.
	 * THIS IS A LIFECYLCE METHOD AND SHOULD ONLY BE CALLED FROM WITHIN THE INTERVAL!!!
	 */
	private readonly fetchFilesFromWorkers = async (): Promise<void> => {
		this.logger.info("fetching files from finished workers...")
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
		this.logger.info("forwarding requests to idle workers...")
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
			if (!this.workers[workerId]) {
				throw new InvalidWorkerIdError(workerId)
			}
			const request = forwardableRequests[i]
			const workerConversionId = await forwardRequestToWorker(
				this.workers[workerId].workerUrl,
				request
			)
			this.updateWorkerConversionStatus(workerId, {
				...request,
				conversionStatus: EConversionStatus.Processing,
				workerConversionId
			})
			const {
				containerName,
				containerStatus
			} = this.workers[workerId].containerInfo
			this.logger.info(`forwarded request ${request.externalConversionId} to ${containerName} (${containerStatus})`)
		}
	}
	/**
	 * Get the docker-container id's of idle workers.
	 * @returns the container id's of idle workers
	 */
	private readonly getIdleWorkerIds = (): string[] => {
		return Object.keys(this.workers).filter(workerId => {
			return this.workers[workerId].currentRequest === null
			&& isHealthy(this.workers[workerId].containerInfo.containerStatus)
		})
			.map(workerId => workerId)
	}
	/**
	 * Get the docker-container ip's.
	 * @returns the ip's of the workers
	 */
	private readonly getWorkerUrls = (): string[] => {
		return Object.keys(this.workers).map(workerId => {
			return this.workers[workerId].workerUrl
		})
	}
	/**
	 * Probe all busy workers for their status.
	 * THIS IS A LIFECYLCE METHOD AND SHOULD ONLY BE CALLED FROM WITHIN THE INTERVAL!!!
	 */
	private readonly probeWorkersForStatus = async (): Promise<void> => {
		this.logger.info("asking busy workers for status update...")
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
		removedContainers.forEach(container => delete this.workers[container.containerId])
		startedContainers.forEach(container => {
			this.workers[container.containerId] = {
				containerInfo: container,
				currentRequest: null,
				workerUrl: `http://${container.containerIp}:3000`
			}
		})
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
		if (!this.workers[workerId]) {
			throw new InvalidWorkerIdError(workerId)
		}
		this.workers[workerId] = {
			...this.workers[workerId],
			currentRequest: conversionRequest
		}
		if (conversionRequest === null) {
			this.logger.info(`${this.workers[workerId].containerInfo.containerName} is now idle`)
		}
	}
}