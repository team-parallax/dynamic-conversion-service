export class InvalidWorkerIdError extends Error {
	constructor(workerId: string) {
		super(`no worker found with ${workerId}`)
	}
}
export class DuplicateWorkerIdError extends Error {
	constructor(workerId: string) {
		super(`${workerId} already exists`)
	}
}
export class NoWorkerConversionIdError extends Error {
	constructor(externalConversionId: string) {
		super(`request ${externalConversionId} has no workerConversionId`)
	}
}