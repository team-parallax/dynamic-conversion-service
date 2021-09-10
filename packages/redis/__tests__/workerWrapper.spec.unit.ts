import {
	DuplicateWorkerIdError,
	InvalidWorkerIdError,
	NoWorkerConversionIdError,
	NoWorkerWithRequestError
} from "../src/worker/exception"
import { EConversionStatus } from "../src/api/conversion-client"
import { ELogLevel } from "logger/src/enum"
import { IContainerInfo } from "auto-scaler/src/docker/interface"
import { IConversionRequest } from "../src/interface"
import { Logger } from "logger"
import { WorkerHandler } from "../src/worker"
describe("WorkerWrapper should pass all tests", () => {
	const invalidRequest: IConversionRequest = {
		conversionRequestBody: {
			file: "",
			filename: "",
			originalFormat: "",
			targetFormat: ""
		},
		conversionStatus: EConversionStatus.Processing,
		externalConversionId: "",
		workerConversionId: null
	}
	let workerManager: WorkerHandler
	beforeAll(() => {
		workerManager = new WorkerHandler(new Logger({
			logLevel: ELogLevel.debug,
			serviceName: "WorkerManagerTest"
		}))
	})
	it("should pass adding/removing a worker", () => {
		const containerInfo: IContainerInfo = {
			containerHealthStatus: "healthy",
			containerId: "container-id",
			containerImage: "foo",
			containerIp: "127.0.0.3",
			containerName: "container-name",
			containerStatus: "running",
			containerTag: "latest"
		}
		expect(workerManager.getWorkerCount()).toEqual(0)
		/* Add a worker */
		workerManager.addWorker(containerInfo)
		expect(workerManager.getWorkerCount()).toEqual(1)
		const workerUrls = workerManager.getWorkerUrls()
		expect(workerUrls.length).toEqual(1)
		expect(workerUrls[0]).toEqual(`http://127.0.0.3:3000`)
		/* Error Checks */
		expect(
			() => workerManager.addWorker(containerInfo)
		).toThrowError(DuplicateWorkerIdError)
		expect(
			() => workerManager.updateWorkerContainer("invalid-id", containerInfo)
		).toThrowError(InvalidWorkerIdError)
		expect(
			() => workerManager.removeWorker("foo-bar-id")
		).toThrowError(InvalidWorkerIdError)
		/* Add a request */
		const validRequest: IConversionRequest = {
			conversionRequestBody: {
				file: "",
				filename: "foo.bar",
				originalFormat: ".png",
				targetFormat: ".jpg"
			},
			conversionStatus: EConversionStatus.Processing,
			externalConversionId: "ext-id",
			workerConversionId: "internal-id"
		}
		workerManager.addRequestToWorker(containerInfo.containerId, validRequest)
		expect(workerManager.getRequestCount()).toEqual(1)
		expect(workerManager.getRequestCountFromWorker("container-id")).toEqual(1)
		expect(
			() => workerManager.getRequestCountFromWorker("invalid-id")
		).toThrowError(InvalidWorkerIdError)
		expect(workerManager.getRequests()).toEqual([validRequest])
		expect(
			() => workerManager.addRequestToWorker(
				containerInfo.containerId,
				invalidRequest
			)
		).toThrowError(NoWorkerConversionIdError)
		expect(
			() => workerManager.addRequestToWorker(
				"invalid-id",
				invalidRequest
			)
		).toThrowError(InvalidWorkerIdError)
		/* Test utility functions */
		expect(workerManager.hasWorkerId("container-id")).toBe(true)
		expect(workerManager.hasWorkerId("invalid-id")).toBe(false)
		expect(workerManager.getContainerName("container-id")).toEqual("container-name")
		expect(
			() => workerManager.getContainerName("foobar")
		).toThrowError(InvalidWorkerIdError)
		expect(workerManager.getIdleWorkerIds()).toEqual([])
		expect(workerManager.getConversionResult("ext-id")).toEqual(validRequest)
		workerManager.updateWorkerConversionStatus(
			"container-id",
			{
				...validRequest,
				conversionStatus: EConversionStatus.Converted
			}
		)
		expect(
			workerManager.getConversionResult("ext-id")?.conversionStatus
		).toEqual(EConversionStatus.Converted)
		expect(
			() => workerManager.updateWorkerConversionStatus("invalid-id", validRequest)
		).toThrowError(InvalidWorkerIdError)
		expect(
			() => workerManager.updateWorkerConversionStatus("container-id", invalidRequest)
		).toThrowError(NoWorkerWithRequestError)
		expect(workerManager.getConversionResult("foo-bar")).toEqual(undefined)
		workerManager.removeRequestFromWorker("container-id", "ext-id")
		expect(
			() => workerManager.removeRequestFromWorker("invalid-id", "foo")
		).toThrowError(InvalidWorkerIdError)
		expect(workerManager.getRequestCount()).toEqual(0)
		expect(workerManager.getRequests()).toEqual([])
		const secondContainerInfo: IContainerInfo = {
			containerHealthStatus: "healthy",
			containerId: "container-id-2",
			containerImage: "foo",
			containerIp: "127.0.0.4",
			containerName: "container-name-2",
			containerStatus: "running",
			containerTag: "latest"
		}
		workerManager.updateWorkers({
			removedContainers: [containerInfo],
			startedContainers: [secondContainerInfo]
		})
		expect(workerManager.getWorkerCount()).toEqual(1)
		expect(workerManager.hasWorkerId("container-id-2")).toBe(true)
		const workerUrls2 = workerManager.getWorkerUrls()
		expect(workerUrls2.length).toEqual(1)
		expect(workerUrls2[0]).toEqual(`http://127.0.0.4:3000`)
		expect(workerManager.getIdleWorkerIds()).toEqual(["container-id-2"])
		expect(workerManager.getForwardableRequestCount(1)).toEqual(1)
		/* Remove a container */
		workerManager.removeWorker(secondContainerInfo.containerId)
		expect(workerManager.getWorkerCount()).toEqual(0)
		expect(workerManager.getWorkerUrls().length).toEqual(0)
	})
})