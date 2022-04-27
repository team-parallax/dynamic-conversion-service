/* eslint-disable no-await-in-loop */
import { AutoScaler } from "auto-scaler"
import { EConversionStatus, IApiConversionFormatResponse } from "./api/conversion-client"
import { IContainerStatus } from "auto-scaler/src/interface"
import {
	IConversionRequest,
	IFinishedRequest
} from "./interface"
import {
	IRedisServiceConfiguration,
	getRedisConfigFromEnv
} from "./config"
import { Logger } from "logger"
import { RedisWrapper } from "./wrapper"
import { WorkerHandler } from "./worker"
import { deleteFile } from "conversion-service/src/service/file-io"
import {
	getFormatsFromWorker,
	isStartingOrHealthy,
	pingWorker,
	removeRequestFile,
	shortID
} from "./util"
import { join } from "path"
import { performance } from "perf_hooks"
import fs from "fs-extra"
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
	private readonly fileTtlLogger: Logger
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
	 * Track requests which are still in queue
	 */
	private readonly requestsInQueue: Map<string, IConversionRequest>
	private totalRequests: number = 0
	/**
	 * The state-handler for all workers.
	 */
	private readonly workerHandler: WorkerHandler
	constructor() {
		this.config = getRedisConfigFromEnv()
		this.logger = new Logger({
			serviceName: "redis-service"
		})
		this.fileTtlLogger = new Logger({
			fileOnly: "file-ttl.log",
			serviceName: "file-ttl"
		})
		const {
			autoScalerConfig,
			redisConfig
		} = this.config
		this.redisWrapper = new RedisWrapper(redisConfig, this.logger)
		this.autoScaler = new AutoScaler(autoScalerConfig)
		this.finishedRequest = new Map()
		this.requestsInQueue = new Map()
		const {
			isLocal
		} = this.config.autoScalerConfig.dockerConfig
		this.workerHandler = new WorkerHandler(this.logger, isLocal)
	}
	/**
	 * Add the given request to the queue to be processed later.
	 * @param conversionRequest request to add to the queue
	 */
	readonly addRequestToQueue = async (conversionRequest: IConversionRequest): Promise<void> => {
		await this.redisWrapper.sendMessage(JSON.stringify(conversionRequest))
		this.requestsInQueue.set(
			conversionRequest.externalConversionId,
			conversionRequest
		)
		const queueDepth = await this.getPendingRequestCount()
		this.logger.info(
			`[API]:: added request ${shortID(conversionRequest.externalConversionId)} [${queueDepth}]`
		)
	}
	/**
	 * Apply the last status.
	 * Should only be called after calling checkHealth.
	 */
	readonly applyState = async (): Promise<void> => {
		if (this.lastStatus !== null) {
			const result = await this.autoScaler.applyConfigurationState(
				this.lastStatus,
				this.workerHandler.getIdleWorkerIds()
			)
			const started = result.startedContainers.length
			const removed = result.removedContainers.length
			this.logger.info(`[APPLIED STATE]:: [${started} started][${removed} removed]`)
			this.lastStatus = null
			this.workerHandler.updateWorkers(result)
		}
	}
	/**
	 * Check if any finished requests have exceeded the TTL.
	 */
	readonly checkFileTtl = async (): Promise<void> => {
		const now = new Date().getTime()
		const promises: Promise<void>[] = []
		const ms = 1000
		this.finishedRequest.forEach(finishedRequest => {
			const cleanFilePromise = async (): Promise<void> => {
				const request = finishedRequest.request
				const requestTime = finishedRequest.finishedTime.getTime()
				if (now - requestTime > this.config.fileTtl * ms) {
					const status = request.conversionStatus
					if (
						status === EConversionStatus.Converted
						|| status === EConversionStatus.Erroneous
					) {
						const deletedPath = await removeRequestFile("output", request)
						this.fileTtlLogger.info(`[FILE_TTL]::[EXCEEDED_TTL]:: deleted [${status}] ${deletedPath}`)
					}
					this.finishedRequest.delete(request.externalConversionId)
				}
			}
			promises.push(cleanFilePromise())
		})
		try {
			await Promise.all(promises)
			if (promises.length > 0) {
				this.logger.info(`[FILE-TTL]:: removed ${promises.length} files`)
			}
		}
		catch (e) {
			this.fileTtlLogger.error(`error during file_ttl: ${e}`)
		}
		const files = await fs.readdir("./output")
		if (files.length > 0) {
			const orphanedPromises: Promise<void>[] = []
			const allRequests = this.workerHandler.getRequests()
			for (const file of files) {
				const id = file.split(".")[0]
				const matchedRequest = allRequests.find(req => req.externalConversionId === id)
				// Not dispatched and not finished
				if (!matchedRequest && !this.finishedRequest.has(id)) {
					const orphanedFilePromise = async (): Promise<void> => {
						this.fileTtlLogger.warn(`[FILE_TTL]:: found orphaned file, removing ${file}`)
						await deleteFile(join("./output", file))
					}
					orphanedPromises.push(orphanedFilePromise())
				}
			}
			try {
				await Promise.all(orphanedPromises)
				if (orphanedPromises.length > 0) {
					this.logger.info(`[FILE-TTL]:: removed ${promises.length} orphaned files`)
				}
			}
			catch (e) {
				this.fileTtlLogger.error(`error during file_ttl: ${e}`)
			}
		}
	}
	/**
	 * Check the current container status.
	 */
	readonly checkHealth = async (): Promise<void> => {
		const pendingRequests = await this.redisWrapper.getPendingMessagesCount()
		const inProgressRequestCount = this.workerHandler.getRequestCount()
		const status = await this.autoScaler.checkContainerStatus(
			pendingRequests + inProgressRequestCount
		)
		for (const container of status.runningContainers) {
			const {
				containerId: id,
				containerName: name,
				containerStatus: status,
				containerHealthStatus: health
			} = container
			/*
			* Remove any dangling containers
			* This mostly is relevant on launch (i.e. initial health check)
			*/
			if (!this.workerHandler.hasWorkerId(id)) {
				this.logger.info(`[HEALTH]:: found dangling container ${name}, removing`)
				await this.autoScaler.removeContainer(id)
			}
			else {
				const requestCount = this.workerHandler.getRequestCountFromWorker(id)
				this.logger.info(`[HEALTH]:: [${name}][${status} | ${health}]:: processing [${requestCount}] requests`)
			}
		}
		const unhealthyContainerIds = status.runningContainers
			.filter(container => this.workerHandler.hasWorkerId(container.containerId))
			.filter(container => !isStartingOrHealthy(container.containerHealthStatus))
			.map(container => container.containerId)
		const unhealthyContainerCount = unhealthyContainerIds.length
		if (unhealthyContainerCount > 0) {
			this.logger.info(`[HEALTH]:: found ${unhealthyContainerCount} unhealthy containers`)
			for (const containerId of unhealthyContainerIds) {
				const requests = this.workerHandler.getRequestsFromWorker(containerId)
				if (requests.length > 0) {
					for (const request of requests) {
						this.logger.info(`[HEALTH]: re-dispatching ${shortID(request.externalConversionId)} from unhealthy worker`)
						await this.addRequestToQueue({
							...request,
							conversionStatus: EConversionStatus.InQueue,
							workerConversionId: null
						})
					}
				}
				this.logger.info(`[${this.workerHandler.getContainerName(containerId)}]:: is unhealthy => removing`)
				await this.autoScaler.removeContainer(containerId)
				this.workerHandler.removeWorker(containerId)
			}
		}
		const inProgressRequestCountAfterHealthCheck = this.workerHandler.getRequestCount()
		this.lastStatus = await this.autoScaler.checkContainerStatus(
			pendingRequests + inProgressRequestCountAfterHealthCheck
		)
		this.logger.info(`[HEALTH]:: Requests = ${inProgressRequestCountAfterHealthCheck}/${pendingRequests} workers/queue`)
		const {
			containersToRemove: remove,
			containersToStart: start
		} = this.lastStatus
		this.lastStatus.runningContainers.forEach(container => {
			this.workerHandler.updateWorkerContainer(
				container.containerId,
				container
			)
		})
		this.logger.info(`[HEALTH]:: SHOULD START ${start} | SHOULD REMOVE ${remove}`)
	}
	/**
	 * Get the current conversion request for the given conversion id.
	 * @param conversionId the conversion id to look for
	 * @returns the current request of the conversion id, undefined if theres
	 * no conversion with the given id
	 */
	readonly getConversionResult = (conversionId: string): IConversionRequest | undefined => {
		if (this.requestsInQueue.has(conversionId)) {
			return this.requestsInQueue.get(conversionId)
		}
		if (this.finishedRequest.has(conversionId)) {
			return this.finishedRequest.get(conversionId)?.request
		}
		return this.workerHandler.getConversionResult(conversionId)
	}
	/**
	 *
	 * @returns
	 */
	readonly getFinishedRequests = (): IConversionRequest[] => {
		const requests: IConversionRequest[] = []
		this.finishedRequest.forEach((v, k) => {
			requests.push({
				...v.request
			})
		})
		return requests
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
		this.logger.info("[FORMATS]:: fetching formats from workers")
		const [workerUrl] = this.workerHandler.getWorkerUrls()
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
	/**
	 * Get the number of pending requests within the queue.
	 * @returns The number of pending requests in the queue
	 */
	readonly getPendingRequestCount = async (): Promise<number> => {
		return this.redisWrapper.getPendingMessagesCount()
	}
	/**
	 *
	 * @returns
	 */
	readonly getRequests = (): IConversionRequest[] => {
		return this.workerHandler.getRequests()
	}
	/**
	 * Check if at least 1 worker is up.
	 * @returns if the at least 1 worker is online
	 */
	readonly hasWorker = (): boolean => {
		return this.workerHandler.getWorkerCount() > 0
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
		const workerUrls = this.workerHandler.getWorkerUrls()
		const pingPromises = workerUrls.map(async url => await pingWorker(url))
		const pingResults = await Promise.all(pingPromises)
		return pingResults.filter(res => res).length > 0
	}
	/**
	 * Retrieve a request from the queue.
	 * @returns a request from the queue
	 */
	readonly popRequest = async (): Promise<IConversionRequest> => {
		const requestString = await this.redisWrapper.receiveMessage()
		const conversionRequest = JSON.parse(requestString) as IConversionRequest
		this.requestsInQueue.delete(conversionRequest.externalConversionId)
		return conversionRequest
	}
	/**
	 * Clean-up and quit the redis-service.
	 */
	readonly quit = async (): Promise<void> => {
		this.logger.info("[EXIT]:: Commencing redis-service cleanup")
		if (this.probeInterval !== null) {
			global.clearInterval(this.probeInterval)
		}
		this.logger.info("[EXIT]:: stopped queue check cron job")
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
		this.logger.info("[START]:: starting main loop")
		try {
			await this.checkHealth()
		}
		catch (error) {
			this.logger.info(`error during health check: ${error}`)
		}
		const ms = 1000
		const {
			healthCheckInterval,
			stateApplicationInterval
		} = this.config.schedulerConfig
		this.logger.info(`[START]:: probing every ${healthCheckInterval}s, applying state every ${stateApplicationInterval}s`)
		/*
		* To ensure data consistency we run everything in the same interval
		* Compute how many normal probes we need until the specified
		* Time for a state apply has elapsed.
		*/
		const probesPerStateApply = Math.ceil(stateApplicationInterval / healthCheckInterval)
		let probeCount = 1
		let isRunning = false
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		this.probeInterval = global.setInterval(async (): Promise<void> => {
			if (isRunning) {
				this.logger.info(`previous probe still running. waiting...`)
				return
			}
			isRunning = true
			const shouldApplyState = probeCount % probesPerStateApply === 0
			const loggerPrefix = shouldApplyState
				? "[HEALTH + STATE]"
				: "[HEALTH]"
			this.logger.info(`${loggerPrefix}: starting probe #${probeCount}`)
			const probeStart = performance.now()
			try {
				/* Checking for dead/unhealthy containers */
				await this.checkHealth()
				/* Forwarding requests to workers */
				await this.forwardRequestsToIdleWorkers()
				/* Probe and update worker conversion status */
				await this.workerHandler.probeWorkersForStatus()
				/* Fetch files */
				const finishedRequests = await this.workerHandler.fetchFiles()
				this.totalRequests += finishedRequests.length
				finishedRequests.forEach(request => {
					this.finishedRequest.set(
						request.request.externalConversionId,
						request
					)
				})
				if (shouldApplyState) {
					await this.applyState()
				}
				await this.checkFileTtl()
			}
			catch (error) {
				this.logger.info(`error during probe #${probeCount}: ${error}`)
			}
			this.logger.info(`[PROBE]:: ${this.totalRequests} finished requests (converted/error)`)
			const probeDuration = (performance.now() - probeStart).toFixed(0)
			const div = 1024
			const mem = (process.memoryUsage().heapTotal / div / div).toFixed(0)
			this.logger.info(`${loggerPrefix}: probe #${probeCount} ended (${probeDuration}ms | ${mem}Mb RAM)`)
			this.logger.info("====================================================================")
			probeCount++
			isRunning = false
		}, healthCheckInterval * ms)
	}
	private readonly forwardRequestsToIdleWorkers = async (): Promise<void> => {
		const pendingRequests = await this.getPendingRequestCount()
		const {
			tasksPerContainer
		} = this.config.autoScalerConfig
		const forwardableRequestCount = this.workerHandler
			.getForwardableRequestCount(tasksPerContainer)
		const requests: IConversionRequest[] = []
		while (
			requests.length < pendingRequests
			&& requests.length < forwardableRequestCount
		) {
			try {
				requests.push(await this.popRequest())
			}
			catch (error) {
				this.logger.info(`failed to pop request: ${error}`)
			}
		}
		try {
			await this.workerHandler.forwardRequests(requests)
			this.logger.info(`[FORWARD]:: ${await this.getPendingRequestCount()} in queue`)
		}
		catch (error) {
			this.logger.info(`failed to forward requests: ${error}`)
		}
	}
}