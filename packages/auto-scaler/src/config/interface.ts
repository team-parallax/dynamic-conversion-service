export interface IAutoScalerConfiguration {
    containerStartThreshold: number,
    dockerConfig: IDockerConfiguration,
    maxContainers: number,
    minContainers: number
}
export interface IDockerConfiguration {
    containerLabel: string,
    host?: string,
    imageName: string,
    port?: number,
    socketPath?: string,
    tag?: string
}