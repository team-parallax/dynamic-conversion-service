export interface IAutoScalerConfiguration {
    containerStartThreshold: number,
    dockerConfig: IDockerConfiguration,
    maxContainers: number,
    minContainers: number
}
export interface IDockerConfiguration {
    containerLabel: string,
    imageId: string,
    socketPath: string
}