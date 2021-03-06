FROM docker:19.03.5-dind

# Set env variables required for passthrough
# to the conversion service instances
ENV WEBSERVICE_PORT="3000" \
	FFMPEG_PATH="/opt/ffmpeg/bin/ffmpeg" \
	IMAGE_MAGICK_PATH="/usr/bin/convert" \
	UNOCONV_PATH="/usr/local/bin/unoconv" \
	MAX_CONVERSION_TIME="90000" \
	MAX_CONVERSION_TRIES="1" \
	CONVERTER_DOCUMENT_PRIORITY="unoconv,imagemagick,ffmpeg," \
	CONVERTER_MEDIA_PRIORITY="ffmpeg,imageMagick,unoconv" \
	CONVERT_TO_PDF_WITH="unoconv" \
	CONVERT_TO_PNG_WITH="imagemagick" \
	CONVERT_FROM_PNG_TO_PDF_WITH="imagemagick" \
	CONVERT_FROM_JPG_TO_PDF_WITH="imagemagick" \
	CONVERT_FROM_JPEG_TO_PDF_WITH="imagemagick"

ENV REDIS_HOST="dcs-redis-server" \
	REDIS_PORT="6379" \
	REDIS_NS="redis-service-test" \
	REDIS_QUEUE="redis-service-test-queue" \
	HEALTH_CHECK_INTERVAL="10" \
	APPLY_DESIRED_STATE_INTERVAL="30"

ENV TASKS_PER_CONTAINER="2" \
	MAX_WORKER_CONTAINERS="10" \
	MIN_WORKER_CONTAINERS="2" \
	CONTAINER_NAME_PREFIX="redis-dev-mode-container_" \
	CONTAINER_IMAGE="teamparallax/conversion-service" \
	CONTAINER_TAG="latest" \
	DOCKER_SOCKET_PATH="/var/run/docker.sock"

WORKDIR /app
ADD . ${WORKDIR}
RUN apk add --no-cache \
	--update \
	--repository="http://dl-cdn.alpinelinux.org/alpine/edge/community" \
	nodejs \
	yarn
RUN yarn install
CMD [ "yarn", "start:redis" ]