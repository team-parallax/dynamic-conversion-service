/* eslint-disable @typescript-eslint/naming-convention */
export interface IContainerInfo {
	containerHealthStatus: string,
	containerId: string,
	containerImage?: string,
	containerIp: string,
	containerName: string,
	containerStatus: string,
	containerTag?: string
}
export interface IDockerApiImage {
	Id: string,
	RepoTags: string[]
}
export interface IDockerContainerStatus {
	Config: {
		Image: string
	},
	Image: string,
	Name: string,
	NetworkSettings: {
		IPAddress: string
	},
	State : {
		Health: {
			Status: string
		},
		Status: string
	}
}