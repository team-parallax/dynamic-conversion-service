export class InvalidWorkerIdError extends Error {
	constructor(workerId: string) {
		super(`no worker found with id: ${workerId}`)
	}
}
export class DuplicateWorkerIdError extends Error {
	constructor(workerId: string) {
		super(`worker with id: ${workerId} already exists`)
	}
}
export class NoWorkerConversionIdError extends Error {
	constructor(externalConversionId: string) {
		super(`request ${externalConversionId} has no workerConversionId`)
	}
}
export class NoWorkerWithRequestError extends Error {
	constructor(workerId: string, externalConversionId: string) {
		super(`worker ${workerId} doesn't have a request with id: ${externalConversionId}`)
	}
}