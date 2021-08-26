// =============================================================
// || conversion-serivce ENVIRONMENT VARIABLES
// || This is a work-around for issue #87
// || https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/-/issues/87
// =============================================================
process.env.WEBSERVICE_PORT = "3000"
process.env.FFMPEG_PATH = "/opt/ffmpeg/bin/ffmpeg"
process.env.IMAGE_MAGICK_PATH = "usr/bin/convert"
process.env.UNOCONV_PATH = "/usr/bin/unoconv"
process.env.MAX_CONVERSION_TIME = "90000"
process.env.MAX_CONVERSION_TRIES = "1"
process.env.CONVERTER_DOCUMENT_PRIORITY = "unoconv,imageMagick"
process.env.CONVERTER_MEDIA_PRIORITY = "ffmpeg,imageMagick,unoconv"
// =============================================================
// || redis-service ENVIRONMENT VARIABLES
// =============================================================
process.env.REDIS_HOST = "127.0.0.1"
process.env.REDIS_PORT = "6379"
process.env.REDIS_NS = "redis-service-test"
process.env.REDIS_QUEUE = "redis-service-test-queue"
process.env.HEALTH_CHECK_INTERVAL = "20"
process.env.APPLY_DESIRED_STATE_INTERVAL = "40"
// =============================================================
// || auto-scaler ENVIRONMENT VARIABLES
// =============================================================
process.env.TASKS_PER_CONTAINER = "1"
process.env.MAX_WORKER_CONTAINERS = "10"
process.env.MIN_WORKER_CONTAINERS = "2"
process.env.CONTAINER_NAME_PREFIX = "redis-dev-mode-container_"
process.env.CONTAINER_IMAGE = "teamparallax/conversion-service"
process.env.CONTAINER_TAG = "latest"
process.env.DOCKER_SOCKET_PATH = "/var/run/docker.sock"
// =============================================================
// It's important to import it here due to issue #87 (see above)
import { Api } from "./api/rest"
import { Container, Scope } from "typescript-ioc"
import { RedisService } from "./service"
// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async (): Promise<void> => {
	const redisService = new RedisService()
	await redisService.initalize()
	await redisService.checkHealth()
	await redisService.applyState()
	redisService.start()
	Container.bind(RedisService)
		.factory(() => redisService)
		.scope(Scope.Singleton)
	const api = new Api()
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	process.on("SIGINT", async (): Promise<void> => {
		await redisService.quit()
		api.close()
	})
	api.listen()
})()