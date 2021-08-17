export class InvalidWorkerIDError extends Error {
	constructor(workerID: string) {
		super(`No worker with ID: ${workerID}`)
	}
}