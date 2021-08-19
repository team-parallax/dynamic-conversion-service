import {
	EConversionStatus,
	IConversionRequestBody
} from "./api/conversion-client"
import { IContainerInfo } from "auto-scaler/src/docker/interface"
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
	converionStatus: EConversionStatus,
	conversionId: string,
	conversionRequestBody: IConversionRequestBody
}