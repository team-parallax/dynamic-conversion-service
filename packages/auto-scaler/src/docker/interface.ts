export interface IContainerInfo {
	containerId: string,
	containerImage?: string,
	containerIp: string,
	containerName: string,
	containerStatus: string,
	containerTag?: string
}
export interface IDockerApiContainer {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Image: string,
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Names: string[],
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Status: string
}
export interface IDockerApiImage {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Id: string,
	// eslint-disable-next-line @typescript-eslint/naming-convention
	RepoTags: string[]
}