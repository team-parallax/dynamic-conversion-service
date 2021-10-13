import {
	TDockerContainerStatus,
	TDockerHealthStatus
} from "./type"
/* eslint-disable @typescript-eslint/naming-convention */
export interface IContainerInfo {
	containerHealthStatus: TDockerHealthStatus,
	containerId: string,
	containerImage?: string,
	containerIp: string,
	containerName: string,
	containerStatus: TDockerContainerStatus,
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