import {
	DuplicateWorkerIdError,
	InvalidWorkerIdError,
	NoWorkerConversionIdError
} from "./exception"
import { EConversionStatus } from "../api/conversion-client"
import { IContainerInfo } from "auto-scaler/src/docker/interface"
import { IContainerStateChange } from "auto-scaler/src/interface"
import {
	IConversionRequest,
	IFinishedRequest,
	IWorkerInfo,
	IWorkers
} from "../interface"
import { Logger } from "logger/src"
import { deleteFile } from "conversion-service/src/service/file-io"
import {
	forwardRequestToWorker,
	getConversionStatus,
	getExtFromFormat,
	getFileFromWorker,
	isHealthy
} from "../util"
import { join } from "path"
export class WorkerHandler {
	/**
	 * Logger
	 */
	private readonly logger: Logger
	/**
	 * The object containing all workers
	 */
	private readonly workers: IWorkers
	constructor(logger: Logger) {
		this.logger = logger
		// This.logger.changeServiceName("Worker-Manager")
		this.workers = {}
	}
	/**
	 * Add a new request to the worker
	 * @param workerId the id of the worker
	 * @param request the request to add to the worker
	 */
	public readonly addRequestToWorker = (
		workerId: string,
		request: IConversionRequest
	): void => {
		if (!this.hasWorkerId(workerId)) {
			throw new InvalidWorkerIdError(workerId)
		}
		if (request.workerConversionId === null) {
			throw new NoWorkerConversionIdError(request.externalConversionId)
		}
		this.workers[workerId].requests.push(request)
		this.logger.info(`[${this.getContainerName(workerId)}] => added ${request.externalConversionId}`)
	}
	/**
	 * Add a new worker.
	 * @param containerInfo The container associated to the worker
	 */
	public readonly addWorker = (containerInfo: IContainerInfo): void => {
		if (this.hasWorkerId(containerInfo.containerId)) {
			throw new DuplicateWorkerIdError(containerInfo.containerId)
		}
		this.workers[containerInfo.containerId] = {
			containerInfo,
			requests: [],
			workerUrl: `http://${containerInfo.containerIp}:3000`
		}
		this.logger.info(`added new worker ${containerInfo.containerName}`)
	}
	public readonly fetchFiles = async () :Promise<IFinishedRequest[]> => {
		const finishedRequests: IFinishedRequest[] = []
		for (const worker of this._workers()) {
			for (const request of worker.requests) {
				if (request.conversionStatus === EConversionStatus.Converted) {
					// eslint-disable-next-line no-await-in-loop
					await getFileFromWorker(
						worker.workerUrl,
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						request.workerConversionId!,
						request.externalConversionId,
						request.conversionRequestBody.targetFormat
					)
					const {
						containerId
					} = worker.containerInfo
					this.removeRequestFromWorker(
						worker.containerInfo.containerId,
						request.externalConversionId
					)
					const containerName = this.getContainerName(containerId)
					this.logger.info(`[FETCH]:: [${containerName}] => fetched file for ${request.externalConversionId}`)
					const ext = getExtFromFormat(request.conversionRequestBody.originalFormat)
					const inputPath = join("input", request.externalConversionId + ext)
					// eslint-disable-next-line no-await-in-loop
					await deleteFile(inputPath)
					this.logger.info(`[FETCH]:: deleted ${inputPath}`)
					finishedRequests.push({
						containerId: worker.containerInfo.containerId,
						request
					})
				}
				else if (request.conversionStatus === EConversionStatus.Erroneous) {
					const {
						containerId
					} = worker.containerInfo
					this.removeRequestFromWorker(
						containerId,
						request.externalConversionId
					)
					const ext = getExtFromFormat(request.conversionRequestBody.originalFormat)
					const inputPath = join("input", request.externalConversionId + ext)
					// eslint-disable-next-line no-await-in-loop
					await deleteFile(inputPath)
					this.logger.info(`[FETCH]:: deleted ${inputPath}`)
					finishedRequests.push({
						containerId: worker.containerInfo.containerId,
						request
					})
				}
			}
		}
		return finishedRequests
	}
	public readonly forwardRequests = async (requests: IConversionRequest[]): Promise<void> => {
		const availableWorkers = this._workers().sort((a, b) => {
			return a.requests.length - b.requests.length
		})
			.slice(0, requests.length)
		for (let i = 0; i < requests.length; i++) {
			const worker = availableWorkers[i]
			const request = requests[i]
			// eslint-disable-next-line no-await-in-loop
			const workerConversionId = await forwardRequestToWorker(
				worker.workerUrl,
				request
			)
			const {
				containerId
			} = worker.containerInfo
			this.addRequestToWorker(
				containerId,
				{
					...request,
					workerConversionId
				}
			)
			this.logger.info(`[${this.getContainerName(containerId)}] ${request.externalConversionId} <=> ${workerConversionId}`)
		}
	}
	/**
	 * Get the name of the worker container
	 * @param workerId the worker
	 * @returns the name of the workers container
	 */
	public readonly getContainerName = (workerId: string): string => {
		if (!this.hasWorkerId(workerId)) {
			throw new InvalidWorkerIdError(workerId)
		}
		return this.workers[workerId].containerInfo.containerName
	}
	/**
	 * Get the result for the given (external) conversion id
	 * @param conversionId external conversion id
	 * @returns the request, undefined if there is no request
	 */
	public readonly getConversionResult = (conversionId: string)
		: IConversionRequest | undefined => {
		const targetRequest = this._workers()
			.map(worker => worker.requests)
			.flat()
			.filter(request => request.externalConversionId === conversionId)
		if (targetRequest.length !== 1) {
			return undefined
		}
		return targetRequest[0]
	}
	/**
	 *
	 * @param tasksPerContainer
	 * @returns
	 */
	public readonly getForwardableRequestCount = (tasksPerContainer: number): number => {
		return this._workers()
			.filter(worker => {
				return worker.requests.length < tasksPerContainer
					&& isHealthy(worker.containerInfo.containerHealthStatus)
			}).length
	}
	/**
	 * Get the ids of the idle workers.
	 * @returns the container ids of the idle workers.
	 */
	public readonly getIdleWorkerIds = (): string[] => {
		return this._workers()
			.filter(worker => worker.requests.length === 0)
			.map(worker => worker.containerInfo.containerId)
	}
	/**
	 * The total number of requests over all workers.
	 * @returns the number of requests assigned to workers
	 */
	public readonly getRequestCount = (): number => {
		return this._workers()
			.map(worker => worker.requests.length)
			.reduce((a, b) => a + b, 0)
	}
	/**
	 * Get the number of requests from the given worker.
	 * @param workerId the worker
	 * @returns the number of requests of the worker
	 */
	public readonly getRequestCountFromWorker = (workerId: string): number => {
		if (!this.hasWorkerId(workerId)) {
			throw new InvalidWorkerIdError(workerId)
		}
		return this.workers[workerId].requests.length
	}
	/**
	 *
	 * @returns
	 */
	public readonly getRequests = (): IConversionRequest[] => {
		return this._workers().map(worker => worker.requests)
			.flat()
	}
	/**
	 * Get the number of running workers.
	 * @returns the number of running workers
	 */
	public readonly getWorkerCount = (): number => {
		return this._workers().length
	}
	/**
	 * Get all Urls from the workers.
	 * @returns urls of the workers
	 */
	public readonly getWorkerUrls = (): string[] => {
		return this._workers().map(worker => worker.workerUrl)
	}
	/**
	 * Check if the given container id exists.
	 * @param workerId the container id to check
	 * @returns true if the container id exists, false otherwise.
	 */
	public readonly hasWorkerId = (workerId: string): boolean => {
		return this.workers[workerId] !== undefined
	}
	/**
	 * Ask all workers for a status update on their conversions.
	 */
	public readonly probeWorkersForStatus = async (): Promise<void> => {
		this.logger.info("[PROBE]:: asking busy workers for status update...")
		for (const worker of this._workers()) {
			for (const request of worker.requests) {
				const {
					containerId
				} = worker.containerInfo
				// eslint-disable-next-line no-await-in-loop
				const status = await getConversionStatus(
					worker.workerUrl,
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					request.workerConversionId!
				)
				this.updateWorkerConversionStatus(containerId, {
					...request,
					conversionStatus: status
				})
				const containerName = this.getContainerName(containerId)
				const {
					externalConversionId,
					workerConversionId
				} = request
				this.logger.info(`[PROBE]:: [${containerName}] [${externalConversionId}][${workerConversionId}] => ${status} `)
			}
		}
	}
	public readonly removeRequestFromWorker = (
		workerId: string,
		externalConversionId: string
	): void => {
		if (!this.hasWorkerId(workerId)) {
			throw new InvalidWorkerIdError(workerId)
		}
		this.workers[workerId].requests = this.workers[workerId].requests.filter(
			request => request.externalConversionId !== externalConversionId
		)
		this.logger.info(`[${this.getContainerName(workerId)}] removed ${externalConversionId}`)
	}
	/**
	 * Remove a worker.
	 * @param containerId  The container id of the worker
	 */
	public readonly removeWorker = (containerId: string): void => {
		if (!this.hasWorkerId(containerId)) {
			throw new InvalidWorkerIdError(containerId)
		}
		const {
			containerName
		} = this.workers[containerId].containerInfo
		delete this.workers[containerId]
		this.logger.info(`removed worker ${containerName}`)
	}
	/**
	 * Update the container info for a worker.
	 * @param workerId the worker to update
	 * @param containerInfo the new container info
	 */
	public readonly updateWorkerContainer = (
		workerId: string,
		containerInfo: IContainerInfo
	): void => {
		if (!this.hasWorkerId(workerId)) {
			throw new InvalidWorkerIdError(workerId)
		}
		this.workers[workerId] = {
			...this.workers[workerId],
			containerInfo
		}
	}
	/**
	 * Update the request assigned to the worker.
	 * @param workerId the worker to update
	 * @param request the request to update
	 */
	public readonly updateWorkerConversionStatus = (
		workerId: string,
		request: IConversionRequest
	): void => {
		if (!this.hasWorkerId(workerId)) {
			throw new InvalidWorkerIdError(workerId)
		}
		let targetIndex = -1
		this.workers[workerId].requests.forEach((req, index) => {
			if (req.externalConversionId === request.externalConversionId) {
				targetIndex = index
			}
		})
		if (targetIndex === -1) {
			throw new Error("Worker xy does not have request ab")
		}
		this.workers[workerId].requests[targetIndex] = request
	}
	/**
	 * Update the workers with the result of the scaling.
	 * @param result The result of the state application.
	 */
	public readonly updateWorkers = (result: IContainerStateChange): void => {
		const {
			removedContainers,
			startedContainers
		} = result
		removedContainers.forEach(container => {
			this.removeWorker(container.containerId)
		})
		startedContainers.forEach(container => {
			this.addWorker(container)
		})
	}
	/**
	 * A utility function to easily get all workers as an array.
	 */
	private readonly _workers = (): IWorkerInfo[] => {
		return Object.keys(this.workers).map(workerId => this.workers[workerId])
	}
}