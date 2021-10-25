export interface IAutoScalerConfiguration {
	dockerConfig: IDockerConfiguration,
	maxContainers: number,
	minContainers: number,
	tasksPerContainer: number
}
export interface IDockerConfiguration {
	envVars?: string[],
	host?: string,
	imageName: string,
	isLocal?: boolean,
	namePrefix: string,
	port?: number,
	socketPath?: string,
	tag?: string
}