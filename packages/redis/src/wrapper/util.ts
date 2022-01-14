export const withTimeout = async (millis: number, promise: Promise<any>): Promise<any> => {
	const timeout = new Promise((resolve, reject) =>
		setTimeout(() => reject(-1), millis))
	return Promise.race([
		promise,
		timeout
	])
}