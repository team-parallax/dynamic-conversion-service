# `redis`

A wrapper around a redis message queue.

# Requirements

Requires a running `redis-server`. [See here.](https://redis.io/)
For simplicity you can use this docker command:

```console
docker run --name redis-testing -p 6379:6379 -d redis:6.2.5-alpine
```

In order to make use of the `docker-compose up` command you need to create a `docker-compose.yml`
file that (at least) contains the following:

```yml
version: "3"
services:
  redis:
    image: redis:6.2.5-alpine
    ports:
      - "6379:6379"
```

If you want to have the `redis` data persistent you can use docker-volumes or bind-mounts

```yml
redis:
  image: redis:6.2.5-alpine
  command: ["redis-server", "--appendonly", "yes"]
  ports:
    - "6379:6379"
  volumes:
    - redis-data:/data
```

## Usage

```ts
const RedisService = require('redis');
const redis = new RedisService({
    redisConfig: {
        host: "127.0.0.1",
        namespace: "test-namespace",
        port: 6379,
        queue: "test-queue"
    }
})
/* This is important */
await redis.initialize()
await redis.send("Hello World")
const message = await redis.receive()
console.log(message) // "Hello World"
```
