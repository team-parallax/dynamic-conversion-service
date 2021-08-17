export interface IAutoScalerConfiguration {
	dockerConfig: IDockerConfiguration,
	maxContainers: number,
	minContainers: number,
	tasksPerContainer: number
}
export interface IDockerConfiguration {
	containerLabel: string,
	host?: string,
	imageName: string,
	port?: number,
	socketPath?: string,
	tag?: string
}