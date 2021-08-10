import { IContainerInfo } from "./docker/interface"
export interface IContainerStatus {
	containersToRemove: number,
	containersToStart: number,
	pendingRequests: number,
	runningContainers: IContainerInfo[]
}
export interface IComputedScalingResult {
	remove: number,
	start: number
}