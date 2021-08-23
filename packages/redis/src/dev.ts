// =============================================================
// || conversion-serivce ENVIRONMENT VARIABLES
// || This is a work-around for issue #87
// || https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/-/issues/87
// =============================================================
process.env.WEBSERVICE_PORT = "3000"
process.env.FFMPEG_PATH = "/bin/ffmpeg"
process.env.UNOCONV_PATH = "/bin/unoconv"
process.env.MAX_CONVERSION_TIME = "90000"
process.env.MAX_CONVERSION_TRIES = "5"
process.env.CONVERTER_DOCUMENT_PRIORITY = "imageMagick,unoconv"
process.env.CONVERTER_MEDIA_PRIORITY = "ffmpeg,unoconv"
// =============================================================
// || redis-service ENVIRONMENT VARIABLES
// =============================================================
process.env.REDIS_HOST = "127.0.0.1"
process.env.REDIS_PORT = "6379"
process.env.NS = "redis-service-test"
process.env.REDIS_QUEUE = "redis-service-test-queue"
// =============================================================
// || auto-scaler ENVIRONMENT VARIABLES
// =============================================================
process.env.TASKS_PER_CONTAINER = "5"
process.env.MAX_WORKER_CONTAINERS = "10"
process.env.MIN_WORKER_CONTAINERS = "2"
process.env.CONTAINER_NAME_PREFIX = "redis-dev-mode-container_"
process.env.CONTAINER_IMAGE = "bash"
process.env.CONTAINER_TAG = "latest"
process.env.DOCKER_SOCKET_PATH = "/var/run/docker.sock"
// =============================================================
// It's important to import it here due to issue #87 (see above)
import { Api } from "./api/rest"
new Api()