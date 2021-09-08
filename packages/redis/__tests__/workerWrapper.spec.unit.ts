import {
	DuplicateWorkerIdError,
	InvalidWorkerIdError,
	NoWorkerConversionIdError
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
			containerStatus: "Up",
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
		/* Remove a container */
		workerManager.removeWorker(containerInfo.containerId)
		expect(workerManager.getWorkerCount()).toEqual(0)
		expect(workerManager.getWorkerUrls().length).toEqual(0)
	})
})