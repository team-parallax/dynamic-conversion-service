# Conversion-Service Mono-Repository

This Mono-Repo setup includes:

- lerna managed packages for:
  - [conversion-service](packages/conversion-service/README.md)
  - [auto-scaler](packages/auto-scaler/README.md)
  - [redis-service](packages/redis/README.md) (Message Queue & load balancing)
  - [logger](packages/logger/README.md)

For further information checkout the README files of the corresponding `package`.

## Usage

The following section describes how to setup and use the `dynamic-conversion-service`.

```bash
docker run --rm -it \
  -p 4322:3000 \                                      # <HOST>:<CONTAINER>
  -e SWAGGER_HOST=http://localhost:4322 \             # The url shown swagger UI
  -v /var/run/docker.sock:/var/run/docker.sock \      # Mounting the docker socket in order to scale
  -v <input_dir>:/app/input                           # Mount <input_dir> to the input within the container
  -v <output_dir>:/app/output                         # Mount <output_dir> to the output within the container
  teamparallax/dynamic-conversion-service:<YOUR_TAG>
```

## Storage
To avoid excessive storage usage, finished conversions will be removed from the
system after the specified TTL (default `3600s`). After that any request will 
result into `404`. To change this value you can adjust the environment variable 
`FILE_TTL` (in seconds).

## Intervals
There are 2 main intervals used within the application:

### `HEALTH_CHECK_INTERVAL` (default `10s`)
Every health check, the application will check if the running containers are 
healthy (determined via `docker healthcheck`). 
If a container is not healthy, it will be removed (not healthy usually means the 
API within the container is not responding to a ping within a specified 
timeframe).  
We also determine whether we need to start or remove any containers.
After that, we will forward requests that are in the queue to idle containers.
A container is considered idle if it has 0 requests assigned to it and is fully 
booted.  
After forwarding as many request as possible to containers, we will check the
status of requests already assigned to containers. If the request has finished
successfully, we will retrieve the file from the container and save it 
in the output directory (`FILE_TTL` starts here). If there was an error during the 
conversion we mark the request as such. In both cases the input file will be 
removed.  
At the end of the cycle, requests which have exceeded the `FILE_TTL` will be
removed.

### `APPLY_DESIRED_STATE_INTERVAL` (default `30s`)
This value should be a multiple of `HEALTH_CHECK_INTERVAL` since it is run 
at the end of each health check if applicable, e.g. assuming the default values 
are used, the state application will be run every 3rd health check.  
The number of containers to start/remove will be applied. Only idle containers
are removed. Starting a container can take a few seconds.

## Shortsummary
- healthcheck
  - remove unhealthy containers
  - remove any dangling containers
  - determine start/remove
- forward requests
- check status of assigned requests
- fetch files from finished requests
- apply scaling (if applicable)
- check `FILE_TTL` and remove if applicable


## Minimal Environment Configuration
- `MAX_WORKER_CONTAINERS` : 50
  - the scaling will not exceed this number
- `MIN_WORKER_CONTAINERS` : 10
  - number of containers that will always run
  - will be created on launch
- `TASKS_PER_CONTAINER` : 1
  - this is used for computing the scaling values
  - requests are only forwarded to containers with no requests
- `CONTAINER_NAME_PREFIX` : someuniquename
  - this is used to identify the containers which are started by the app
  - it's a prefix since the app will a unique id to the name
- `CONTAINER_IMAGE` : teamparallax/conversion-service
  - the image used for containers
- `CONTAINER_TAG`: latest
  - the tag used for containers
- `DOCKER_SOCKET_PATH:` `/var/run/docker.sock`
  - only change if you are not using the docker container
