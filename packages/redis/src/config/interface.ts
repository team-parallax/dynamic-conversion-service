export interface IRedisConfiguration {
    host: string,
    namespace: string,
    port: number,
    queue: string
}
export interface IRedisServiceConfiguration {
    redisConfig: IRedisConfiguration
}