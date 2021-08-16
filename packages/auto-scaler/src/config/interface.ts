export interface IAutoScalerConfiguration {
    containerStartThreshold: number,
    dockerConfig: IDockerConfiguration,
    maxContainers: number,
    minContainers: number
}
export interface IDockerConfiguration {
    containerLabel: string,
    host?: string,
    imageId: string,
    port?: number,
    socketPath?: string,
    tag?: string
}