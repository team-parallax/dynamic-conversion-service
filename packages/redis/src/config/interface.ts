import { IAutoScalerConfiguration } from "auto-scaler/src/config"
export interface IRedisConfiguration {
    host: string,
    namespace: string,
    port: number,
    queue: string
}
export interface IRedisServiceConfiguration {
    autoScalerConfig: IAutoScalerConfiguration,
    redisConfig: IRedisConfiguration
}