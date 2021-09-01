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