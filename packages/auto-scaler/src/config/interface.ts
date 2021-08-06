export interface IAutoScalerConfiguration {
    containerStartThreshold: number,
    dockerConfig: IDockerConfiguration,
    maxContainers: number
}
export interface IDockerConfiguration {
    containerLabel: string,
    imageId: string,
    socketPath: string
}