import { IContainerInfo } from "./docker/interface"
export interface IContainerStatus {
    containersToRemove: number,
    containersToStart: number,
    pendingRequests: number,
    runningContainers: IContainerInfo[]
}