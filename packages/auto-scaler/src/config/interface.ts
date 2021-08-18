export interface IAutoScalerConfiguration {
	dockerConfig: IDockerConfiguration,
	maxContainers: number,
	minContainers: number,
	tasksPerContainer: number
}
export interface IDockerConfiguration {
	host?: string,
	imageName: string,
	namePrefix: string,
	port?: number,
	socketPath?: string,
	tag?: string
}