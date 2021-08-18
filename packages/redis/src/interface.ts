import { IContainerInfo } from "auto-scaler/src/docker/interface"
export interface IContainerCheck {
    containerInfo: IContainerInfo,
    isRunning: boolean
}