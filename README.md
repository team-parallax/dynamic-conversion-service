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

```console
docker run --rm -it \
  -p 4322:3000 \                                      # <HOST>:<CONTAINER>
  -e SWAGGER_HOST=http://localhost:4322 \             # The url shown swagger UI
  -v /var/run/docker.sock:/var/run/docker.sock \      # Mounting the docker socket in order to scale
  teamparallax/dynamic-conversion-service:<YOUR_TAG>
```
