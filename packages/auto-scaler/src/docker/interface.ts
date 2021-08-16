export interface IContainerInfo {
	containerId: string,
	containerImage?: string,
	containerLabel: string,
	containerTag?: string
}
export interface IDockerAPIContainer {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Image: string,
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Names: string[]
}