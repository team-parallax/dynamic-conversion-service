// It's important to import it here due to issue #87 (see above)
import { Api } from "./api/rest"
import {
	Container,
	Scope
} from "typescript-ioc"
import { RedisService } from "./service"
import { isStringNumber } from "./config"
// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async (): Promise<void> => {
	try {
		const portStr = process.env.WEBSERVICE_PORT
		if (!isStringNumber(portStr)) {
			throw new Error(`port: '${portStr}' is not a valid port!`)
		}
		let port = 3000
		if (portStr) {
			port = parseInt(portStr)
		}
		const redisService = new RedisService()
		await redisService.initialize()
		await redisService.checkHealth()
		await redisService.applyState()
		await redisService.start()
		Container.bind(RedisService)
			.factory(() => redisService)
			.scope(Scope.Singleton)
		const api = new Api(port)
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		process.on("SIGINT", async (): Promise<void> => {
			await redisService.quit()
			api.close()
		})
		api.listen()
	}
	catch (error) {
		// eslint-disable-next-line no-console
		console.log(error)
		process.exit(1)
	}
})()