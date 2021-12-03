import { EConversionStatus } from "../enum"
import {
	IConversionBase,
	IConversionFile,
	IConversionStatus
} from "../../../abstract/converter/interface"
import { IConversionInQueue } from "../interface"
import { Inject } from "typescript-ioc"
import {
	InvalidPathError,
	MaxConversionTriesError,
	NoSuchConversionIdError
} from "../../../constants"
import { Logger } from "../../../service/logger"
import {
	TConversionFiles,
	TConversionIdToConversionFileMap,
	TNullableConversionFile
} from "./types"
import config from "../../../config"
const initialIdMap: TConversionIdToConversionFileMap = new Map()
export class ConversionQueue {
	private static instance: ConversionQueue
	@Inject
	private readonly logger!: Logger
	private currentlyConverting!: TNullableConversionFile
	private isConverting!: boolean
	constructor(
		private convLog: TConversionIdToConversionFileMap = initialIdMap,
		private conversion: TConversionFiles = []
	) {
		if (ConversionQueue.instance) {
			return ConversionQueue.instance
		}
		ConversionQueue.instance = this
		this.currentlyConverting = null
		this.isConverting = false
		return this
	}
	public addToConversionQueue(
		requestObject: IConversionFile
	): IConversionBase {
		const {
			conversionTries: maxConversionTries
		} = config.conversionMaximaConfiguration
		const {
			retries
		} = requestObject
		if (retries > maxConversionTries) {
			throw new MaxConversionTriesError(requestObject.conversionId)
		}
		this.conversion.push(requestObject)
		this.convLog.set(requestObject.conversionId, {
			...requestObject,
			retries,
			status: EConversionStatus.inQueue
		})
		return {
			conversionId: requestObject.conversionId
		}
	}
	public changeConvLogEntry(
		conversionId: string,
		status: EConversionStatus,
		convertedFilePath?: string
	): void {
		const element = this.convLog.get(conversionId)
		if (!element) {
			this.logger.error(`No element found for ${conversionId}`)
			throw new NoSuchConversionIdError("No such conversion element")
		}
		else {
			if (status === EConversionStatus.converted) {
				this.logger.log(`${conversionId} is converted`)
				if (!convertedFilePath) {
					this.logger.log(`No converted file found for: ${conversionId}`)
					throw new InvalidPathError(`No path given for id: ${conversionId}`)
				}
				this.logger.log(`Set new filepath for ${conversionId}`)
				element.path = convertedFilePath
			}
			this.logger.log(`Update status for ${conversionId} to ${status}`)
			element.status = status
			this.convLog.set(conversionId, element)
			this.logger.log(`Actual Status = ${this.convLog.get(conversionId)?.status}`)
		}
	}
	public getNextQueueElement(): IConversionFile | undefined {
		return this.conversionQueue.shift()
	}
	public getStatusById(conversionId: string): IConversionStatus {
		this.logger.log(`Retrieve status for ${conversionId}`)
		const conversion = this.convLog.get(conversionId)
		if (!conversion) {
			throw new NoSuchConversionIdError(`No conversion request found for given conversionId ${conversionId}`)
		}
		return this.response(conversion.status, conversionId)
	}
	private response(
		status: EConversionStatus,
		conversionId: string
	): IConversionStatus {
		const requestObject = this.convLog.get(conversionId) as IConversionStatus
		const response: IConversionStatus = {
			...requestObject,
			conversionId,
			status
		}
		if (status === EConversionStatus.inQueue) {
			// Add one to have 1-indexed queue
			const queuePosition: number = this.conversionQueue.findIndex(
				item => item.conversionId === conversionId
			) + 1
			const inQueueResponse: IConversionInQueue = {
				...response,
				queuePosition
			}
			return inQueueResponse
		}
		else if (status === EConversionStatus.converted) {
			const convertedFile = this.conversionLog.get(conversionId) as IConversionStatus
			return {
				...response,
				path: convertedFile.path
			}
		}
		return response
	}
	get conversionLog(): TConversionIdToConversionFileMap {
		return this.convLog
	}
	set conversionLog(newConversionLog: TConversionIdToConversionFileMap) {
		this.convLog = newConversionLog
	}
	get conversionQueue(): TConversionFiles {
		return this.conversion
	}
	set conversionQueue(newConversionQueue: TConversionFiles) {
		this.conversion = newConversionQueue
	}
	get currentlyConvertingFile(): TNullableConversionFile {
		return this.currentlyConverting
	}
	set currentlyConvertingFile(file: TNullableConversionFile) {
		this.currentlyConverting = file
	}
	get isCurrentlyConverting(): boolean {
		return this.isConverting
	}
	set isCurrentlyConverting(isNewConvertingVal: boolean) {
		this.isConverting = isNewConvertingVal
	}
}