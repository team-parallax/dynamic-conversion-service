export interface IContainerInfo {
	containerId: string,
	containerImage?: string,
	containerIp: string,
	containerName: string,
	containerTag?: string
}
export interface IDockerAPIContainer {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Image: string,
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Names: string[]
}
export interface IDockerAPIImage {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Id: string,
	// eslint-disable-next-line @typescript-eslint/naming-convention
	RepoTags: string[]
}