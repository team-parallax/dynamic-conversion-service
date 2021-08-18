export class InvalidWorkerIdError extends Error {
	constructor(workerId: string) {
		super(`No worker with ID: ${workerId}`)
	}
}