export class InvalidWorkerIdError extends Error {
	constructor(workerId: string) {
		super(`No worker with ID: ${workerId}`)
	}
}
export class InvalidFormatError extends Error {
	constructor(filename: string, originalFormat?:string) {
		super(`could not determine extension from filename (${filename}) or original-format parameter (${originalFormat})`)
	}
}
export class FormatRetrievalError extends Error {
	constructor(workerUrl: string) {
		super(`failed to retrieve formats formats ${workerUrl}`)
	}
}
export class FileRetrievalError extends Error {
	constructor(workerUrl: string) {
		super(`failed to retrieve file from ${workerUrl}`)
	}
}
export class StatusUpdateError extends Error {
	constructor(workerUrl: string) {
		super(`failed to retrieve status from ${workerUrl}`)
	}
}
export class RequestFormatError extends Error {
	constructor(workerUrl: string) {
		super(`failed to forward request to ${workerUrl}`)
	}
}