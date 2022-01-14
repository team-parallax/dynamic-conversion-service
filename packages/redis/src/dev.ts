// =============================================================
// || conversion-serivce ENVIRONMENT VARIABLES
// || This is a work-around for issue #87
// || https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/-/issues/87
// =============================================================
process.env.WEBSERVICE_PORT = "3000"
process.env.FFMPEG_PATH = "/opt/ffmpeg/bin/ffmpeg"
process.env.IMAGE_MAGICK_PATH = "/usr/bin/convert"
process.env.UNOCONV_PATH = "/usr/local/bin/unoconv"
process.env.MAX_CONVERSION_TIME = "90000"
process.env.MAX_CONVERSION_TRIES = "1"
process.env.CONVERTER_DOCUMENT_PRIORITY = "unoconv,imagemagick,ffmpeg"
process.env.CONVERTER_MEDIA_PRIORITY = "ffmpeg,imagemagick,unoconv"
process.env.CONVERT_TO_PDF_WITH = "unoconv"
process.env.CONVERT_TO_PNG_WITH = "imagemagick"
process.env.CONVERT_FROM_PNG_TO_PDF_WITH = "imagemagick"
process.env.CONVERT_FROM_JPG_TO_PDF_WITH = "imagemagick"
process.env.CONVERT_FROM_JPEG_TO_PDF_WITH = "imagemagick"
// =============================================================
// || redis-service ENVIRONMENT VARIABLES
// =============================================================
process.env.REDIS_HOST = "172.17.0.1"
process.env.HEALTH_CHECK_INTERVAL = "10"
process.env.APPLY_DESIRED_STATE_INTERVAL = "15"
process.env.REDIS_TIMEOUT = "10"
process.env.FILE_TTL = "30"
// =============================================================
// || auto-scaler ENVIRONMENT VARIABLES
// =============================================================
process.env.TASKS_PER_CONTAINER = "1"
process.env.MAX_WORKER_CONTAINERS = "10"
process.env.MIN_WORKER_CONTAINERS = "1"
process.env.CONTAINER_NAME_PREFIX = "dcs-worker_"
process.env.CONTAINER_IMAGE = "teamparallax/conversion-service"
process.env.CONTAINER_TAG = "latest"
process.env.DOCKER_SOCKET_PATH = "/var/run/docker.sock"
process.env.LOCAL_DEPLOYMENT = "true"
// =============================================================
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
		const cleanUp = async (): Promise<void> => {
			await redisService.quit()
			api.close()
		}
		[`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach(eventType => {
			// eslint-disable-next-line @typescript-eslint/no-misused-promises
			process.on(eventType, async (e): Promise<void> => {
				if (e) {
					// eslint-disable-next-line no-console
					console.log(e)
				}
				await cleanUp()
			})
		})
		api.listen()
	}
	catch (error) {
		// eslint-disable-next-line no-console
		console.log(error)
		process.exit(1)
	}
})()