import { IContainerInfo } from "./docker/interface"
export interface IContainerStatus {
    containersToKill: number,
    containersToStart: number,
    pendingRequests: number,
    runningContainers: IContainerInfo[]
}