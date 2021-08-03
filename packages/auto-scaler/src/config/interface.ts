/**
 * The Configuration of the AutoScaler.
 */
export interface IAutoScalerConfiguration {
    /**
     * Threshold for starting containers.
     */
    containerStartThreshold: number,
    /**
     * The docker configuration.
     */
    dockerConfig: IDockerConfiguration,
     /**
      * Maximum number of containers which are allowed to run.
      */
    maxContainers: number
}
export interface IDockerConfiguration {
    containerLabel: string,
    imageId: string,
    socketPath: string
}