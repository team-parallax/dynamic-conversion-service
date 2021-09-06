/* eslint-disable no-await-in-loop */
import { AutoScaler } from "auto-scaler"
import { IApiConversionFormatResponse } from "./api/conversion-client"
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
	isStartingOrHealthy,
	isUnhealthy,
	pingWorker
} from "./util"
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
		this.logger.info(`added request ${conversionRequest.externalConversionId} to queue [${queueDepth}]`)
	}
	/**
	 * Apply the last status.
	 * Should only be called after calling checkHealth.
	 */
	readonly applyState = async (): Promise<void> => {
		if (this.lastStatus !== null) {
			const idleWorkerIds = this.getIdleWorkerIds()
			idleWorkerIds.forEach(id => this.logger.info(`[${this.getContainerName(id)}]:: IDLE`))
			const result = await this.autoScaler.applyConfigurationState(
				this.lastStatus,
				this.getIdleWorkerIds()
			)
			const started = result.startedContainers.length
			const removed = result.removedContainers.length
			this.logger.info(`STATE: [${started} started][${removed} removed]`)
			this.lastStatus = null
			this.updateActiveWorkers(result)
		}
	}
	/**
	 * Check the current container status.
	 */
	readonly checkHealth = async (): Promise<void> => {
		const pendingRequests = await this.redisWrapper.getPendingMessagesCount()
		const inProgressRequestCount = this.getInProgressRequestCount()
		const status = await this.autoScaler.checkContainerStatus(
			pendingRequests + inProgressRequestCount
		)
		status.runningContainers.forEach(container => {
			const {
				containerId: id,
				containerIp: ip,
				containerName: name,
				containerStatus: status,
				containerHealthStatus: health
			} = container
			const requestCount = this.getRequestCount(id)
			this.logger.info(`[STATUS]:${name} [${requestCount}] => ${status}|${health} ${ip}`)
		})
		const unhealthyContainerIds = status.runningContainers
			.filter(container => !isStartingOrHealthy(container.containerHealthStatus))
			.map(container => container.containerId)
		const unhealthyContainerCount = unhealthyContainerIds.length
		if (unhealthyContainerCount > 0) {
			this.logger.info(`found ${unhealthyContainerCount} unhealthy containers`)
			for (const containerId of unhealthyContainerIds) {
				this.logger.info(`[${this.getContainerName(containerId)}]:: is unhealthy => removing`)
				await this.autoScaler.removeContainer(containerId)
				delete this.workers[containerId]
			}
		}
		const inProgressRequestCountAfterHealthCheck = this.getInProgressRequestCount()
		this.lastStatus = await this.autoScaler.checkContainerStatus(
			pendingRequests
		)
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
		this.logger.info(`[HEALTH]: should start ${start} | remove ${remove} containers`)
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
		Object.keys(this.workers).forEach(workerId => {
			conversionRequest = this.workers[workerId].requests.filter(
				request => request.externalConversionId === conversionId
			).pop()
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
			/*
			* This has a really, really low chance of happening so
			* A custom error is not required
			*/
			throw new Error("no worker replied with formats")
		}
	}
	readonly getInProgressRequestCount = (): number => {
		return this.getWorkers().map(worker => worker.requests.length)
			.reduce((a, b) => a + b, 0)
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
	readonly initialize = async (): Promise<void> => {
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
			global.clearInterval(this.probeInterval)
		}
		this.logger.info("stopped queue check cron job")
		await this.redisWrapper.quit()
		const {
			runningContainers
		} = await this.autoScaler.checkContainerStatus(0)
		const runningContainerIds = runningContainers.map(container => container.containerId)
		await this.autoScaler.applyConfigurationState(
			{
				containersToRemove: runningContainers.length,
				containersToStart: 0,
				pendingRequests: 0,
				runningContainers
			},
			runningContainerIds
		)
	}
	/**
	 * Start the queue and health check cron jobs.
	 */
	readonly start = async (): Promise<void> => {
		this.logger.info("starting main loop")
		await this.checkHealth()
		const ms = 1000
		const queueProbeInterval = 10
		const {
			healthCheckInterval,
			stateApplicationInterval
		} = this.config.schedulerConfig
		/*
		* To ensure data consistency we run everything in the same interval
		* Compute how many normal probes we need until the specified
		* Time for a state apply has elapsed.
		*/
		const probesPerStateApply = Math.ceil(stateApplicationInterval / queueProbeInterval)
		let probeCount = 1
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		this.probeInterval = global.setInterval(async (): Promise<void> => {
			const shouldApplyState = probeCount % probesPerStateApply === 0
			const loggerPrefix = shouldApplyState
				? "[HEALTH+STATE]"
				: "[HEALTH]"
			this.logger.info(`${loggerPrefix}: #${probeCount}`)
			const probeStart = performance.now()
			/* Checking for dead/unhealthy containers */
			await this.checkHealth()
			/* Forwarding requests to workers */
			await this.forwardRequestsToIdleWorkers()
			/* Probe and update worker conversion status */
			await this.probeWorkersForStatus()
			/* Fetch files */
			await this.fetchFilesFromWorkers()
			if (probeCount % probesPerStateApply === 0) {
				await this.applyState()
			}
			probeCount++
			const probeDuration = performance.now() - probeStart
			this.logger.info(`${loggerPrefix}: ${Number(probeDuration).toFixed(0)}ms`)
		}, healthCheckInterval * ms)
	}
	private readonly addRequestToWorker = (workerId: string, request:IConversionRequest):void => {
		this.workers[workerId].requests.push(request)
	}
	/**
	 * Fetch the files from workers where the conversion succeeded and
	 * remove the request from the worker.
	 * THIS IS A LIFECYLCE METHOD AND SHOULD ONLY BE CALLED FROM WITHIN THE INTERVAL!!!
	 */
	private readonly fetchFilesFromWorkers = async (): Promise<void> => {
		const workerIds = Object.keys(this.workers)
		for (const workerId of workerIds) {
			for (const request of this.workers[workerId].requests) {
				if (request.conversionStatus === "converted") {
					await getFileFromWorker(
						this.workers[workerId].workerUrl,
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						request.workerConversionId!,
						request.externalConversionId,
						request.conversionRequestBody.targetFormat
					)
					this.removeRequestFromWorker(
						this.workers[workerId].containerInfo.containerId,
						request.externalConversionId
					)
					const containerName = this.getContainerName(workerId)
					this.logger.info(`fetched file from ${containerName}`)
					const ext = getExtFromFormat(request.conversionRequestBody.originalFormat)
					const inputPath = join("input", request.externalConversionId + ext)
					await deleteFile(inputPath)
					this.logger.info(`deleted ${inputPath}`)
					this.finishedRequest.set(request.externalConversionId, {
						containerId: workerId,
						request
					})
				}
				else if (request.conversionStatus === "erroneous") {
					this.removeRequestFromWorker(
						this.workers[workerId].containerInfo.containerId,
						request.externalConversionId
					)
					const ext = getExtFromFormat(request.conversionRequestBody.originalFormat)
					const inputPath = join("input", request.externalConversionId + ext)
					await deleteFile(inputPath)
					this.logger.info(`deleted ${inputPath}`)
					this.finishedRequest.set(request.externalConversionId, {
						containerId: this.workers[workerId].containerInfo.containerId,
						request
					})
				}
			}
		}
	}
	/**
	 * Dispatch requests from the queue to idle workers.
	 * THIS IS A LIFECYLCE METHOD AND SHOULD ONLY BE CALLED FROM WITHIN THE INTERVAL!!!
	 */
	private readonly forwardRequestsToIdleWorkers = async (): Promise<void> => {
		this.logger.info(`${await this.getPendingRequestCount()} in queue`)
		this.logger.info("forwarding requests to free workers...")
		const {
			tasksPerContainer
		} = this.config.autoScalerConfig
		// Sort workers by request count ascending
		const workerIds = Object.keys(this.workers).sort((a, b) => {
			const workerARequestCount = this.workers[a].requests.length
			const workerBRequestCount = this.workers[b].requests.length
			return workerARequestCount - workerBRequestCount
		})
		for (const workerId of workerIds) {
			if (this.workers[workerId].requests.length === tasksPerContainer) {
				continue
			}
			if (isUnhealthy(this.workers[workerId].containerInfo.containerHealthStatus)) {
				continue
			}
			if (this.workers[workerId].requests.length < tasksPerContainer
				&& await this.getPendingRequestCount() > 0) {
				const request = await this.popRequest()
				const workerConversionId = await forwardRequestToWorker(
					this.workers[workerId].workerUrl,
					request
				)
				this.addRequestToWorker(workerId, {
					...request,
					workerConversionId
				})
				const containerName = this.getContainerName(workerId)
				const extId = request.externalConversionId
				this.logger.info(`forwarded ${extId} to ${containerName} (${workerConversionId})`)
			}
		}
	}
	/**
	 * Utility function to get the container name of the worker
	 * @param workerId The id of the worker to get the container name for
	 * @returns the name of the container worker
	 */
	private readonly getContainerName = (workerId: string): string => {
		return this.workers[workerId].containerInfo.containerName
	}
	/**
	 * Get the docker-container id's of idle workers.
	 * @returns the container id's of idle workers
	 */
	private readonly getIdleWorkerIds = (): string[] => {
		return Object.keys(this.workers).filter(workerId => {
			const workerRequests = this.workers[workerId].requests
			return isHealthy(
				this.workers[workerId].containerInfo.containerHealthStatus
			) && workerRequests.length === 0
		})
	}
	/**
	 * Get the number of request the given worker has.
	 * @param workerId The workerId of the worker
	 * @returns the number of requests the worker is currently processing
	 */
	private readonly getRequestCount = (workerId: string): number => {
		return this.workers[workerId].requests.length
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
		const workerIds = Object.keys(this.workers)
		for (const workerId of workerIds) {
			for (const request of this.workers[workerId].requests) {
				const status = await getConversionStatus(
					this.workers[workerId].workerUrl,
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					request.workerConversionId!
				)
				this.updateWorkerConversionStatus(workerId, {
					...request,
					conversionStatus: status
				})
				const containerName = this.getContainerName(workerId)
				const {
					externalConversionId,
					workerConversionId
				} = request
				this.logger.info(`${containerName}::${externalConversionId} || ${workerConversionId} => ${status} `)
			}
		}
	}
	/**
	 * Remove the given external id from the worker.
	 * This should only happen if a conversion is finished (converted or error)
	 * @param workerId The worker to remove the request from
	 * @param externalConversionId The external converison id from the request
	 */
	private readonly removeRequestFromWorker = (
		workerId: string,
		externalConversionId: string
	): void => {
		const filteredWorkerRequests = this.workers[workerId].requests.filter(
			request => request.externalConversionId !== externalConversionId
		)
		this.workers[workerId].requests = filteredWorkerRequests
	}
	/**
	 * Update the running workers. Remove stopped containers.
	 * Ping started containers and stop them if they do not reply
	 * after 3 retries.
	 * @param IContainerStateChange the result of applying the new container state
	 */
	private readonly updateActiveWorkers = (
		{
			removedContainers,
			startedContainers
		}: IContainerStateChange
	): void => {
		removedContainers.forEach(container => delete this.workers[container.containerId])
		startedContainers.forEach(container => {
			this.workers[container.containerId] = {
				containerInfo: container,
				requests: [],
				workerUrl: `http://${container.containerIp}:3000`
			}
		})
	}
	/**
	 * Update the status of the request processed by the given worker
	 * @param workerId The id of the worker
	 * @param conversionRequest The request to update
	 */
	private readonly updateWorkerConversionStatus = (
		workerId: string,
		conversionRequest: IConversionRequest
	): void => {
		if (!this.workers[workerId]) {
			throw new InvalidWorkerIdError(workerId)
		}
		const workerRequests = this.workers[workerId].requests.map(request => {
			if (request.workerConversionId === conversionRequest.workerConversionId) {
				return conversionRequest
			}
			else {
				return request
			}
		})
		this.workers[workerId] = {
			...this.workers[workerId],
			requests: workerRequests
		}
	}
}