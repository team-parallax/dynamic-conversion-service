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
	// CurrentRequest: IConversionRequest | null,
	requests: IConversionRequest[],
	workerUrl: string
}
export interface IConversionRequest {
	conversionRequestBody: IConversionRequestBody,
	conversionStatus: EConversionStatus,
	externalConversionId:string,
	workerConversionId: string | null
}
export interface IFinishedRequest {
	containerId: string,
	request: IConversionRequest
}
export interface IWorkers {
	[containerId: string]: IWorkerInfo
}