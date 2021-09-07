import {
	DuplicateWorkerIdError, InvalidWorkerIdError, NoWorkerConversionIdError
} from "./exception"
import { IContainerInfo } from "auto-scaler/src/docker/interface"
import { IConversionRequest, IWorkers } from "../interface"
import { Logger } from "logger/src"
export class WorkerManager {
	private readonly logger: Logger
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
	/**
	 * The total number of requests over all workers.
	 * @returns the number of requests assigned to workers
	 */
	public readonly getRequestCount = (): number => {
		return Object.keys(this.workers)
			.map(workerId => this.workers[workerId].requests.length)
			.reduce((a, b) => a + b, 0)
	}
	/**
	 * Get the number of running workers.
	 * @returns the number of running workers
	 */
	public readonly getWorkerCount = (): number => {
		return Object.keys(this.workers).length
	}
	/**
	 * Get all Urls from the workers.
	 * @returns urls of the workers
	 */
	public readonly getWorkerUrls = (): string[] => {
		return Object.keys(this.workers)
			.map(workerId => this.workers[workerId].workerUrl)
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
	private readonly hasWorkerId = (workerId: string): boolean => {
		return this.workers[workerId] !== undefined
	}
}