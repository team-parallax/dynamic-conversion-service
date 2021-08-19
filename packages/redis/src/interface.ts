import { IContainerInfo } from "auto-scaler/src/docker/interface"
import { IConversionRequestBody } from "./api/conversion-client"
export interface IContainerCheck {
    containerInfo: IContainerInfo,
    isRunning: boolean
}
export interface IWorkerInfo {
	containerInfo: IContainerInfo,
	currentRequest: IConversionRequest | null,
	workerUrl: string
}
export interface IConversionRequest {
	conversionId: string,
	conversionRequestBody: IConversionRequestBody
}