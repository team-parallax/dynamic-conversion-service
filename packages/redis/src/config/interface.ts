import { IAutoScalerConfiguration } from "auto-scaler/src/config"
export interface IRedisConfiguration {
    host: string,
    namespace: string,
    port: number,
    queue: string
}
export interface ISchedulerConfiguration {
    healthCheckInterval: number,
    stateApplicationInterval: number
}
export interface IRedisServiceConfiguration {
    autoScalerConfig: IAutoScalerConfiguration,
    fileTtl: number,
    redisConfig: IRedisConfiguration,
    schedulerConfig: ISchedulerConfiguration
}