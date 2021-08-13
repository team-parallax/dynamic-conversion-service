# `redis`

A wrapper around a redis message queue.

# Requirements
Requires a running `redis-server`. [See here.](https://redis.io/)  
For simplicity you can use this docker command:  
```
docker run --name redis-testing -p 6379:6379 -d redis:6.2.5-alpine 
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
// This is important
await redis.initialize()
await redis.send("Hello World")
const message = await redis.receive()
console.log(message) // "Hello World"

```
