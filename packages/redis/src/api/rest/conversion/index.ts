import {
	Body,
	Controller,
	Deprecated,
	Get,
	Path,
	Post,
	// eslint-disable-next-line unused-imports/no-unused-imports-ts
	Query,
	Request,
	Route,
	Tags
} from "tsoa"
import { Container } from "typescript-ioc"
import { EConversionStatus } from "redis/src/api/conversion-client"
import {
	EHttpResponseCodes,
	InvalidRequestBodyError
} from "conversion-service/src/constants"
import {
	IConversionProcessingResponse,
	IConversionQueueStatus,
	IConversionRequestBody,
	IUnsupportedConversionFormatError
} from "conversion-service/src/service/conversion/interface"
import { IConversionStatus, TApiConvertedCompatResponseV1 } from "conversion-service/src/abstract/converter/interface"
import { RedisService } from "redis/src/service"
import { assertStatus } from "./util"
import { getExt } from "../../../util"
import { getType } from "mime"
import {
	handleError,
	handleMultipartFormData
} from "conversion-service/src/service/conversion/util"
import { join } from "path"
import { readFromFileSync, writeToFile } from "conversion-service/src/service/file-io"
import { v4 as uuidV4 } from "uuid"
import express from "express"
import fs from "fs"
@Route("/conversion")
@Tags("Conversion")
export class ConversionController extends Controller {
	private readonly redisService: RedisService = Container.get(RedisService)
	/**
	 * Adds the file from the request body to the internal conversion queue.
	 * The files in queue will be processed after the FIFO principle.
	 * @param request contains the conversion request and the uploaded file
	 */
	@Post("/v2")
	public async convertFile(
		@Request() request: express.Request
	): Promise<IConversionProcessingResponse | IUnsupportedConversionFormatError> {
		try {
			const multipartConversionRequest = await handleMultipartFormData(request)
			const {
				originalFormat,
				targetFormat,
				filename,
				file
			} = multipartConversionRequest
			// Temporary solution since I don't know how it normally works
			const externalConversionId = uuidV4()
			const ext = getExt(filename, originalFormat)
			await writeToFile(join("input", `${externalConversionId}${ext}`), file)
			await this.redisService.addRequestToQueue({
				conversionRequestBody: {
					file: "",
					filename,
					originalFormat,
					targetFormat
				},
				conversionStatus: EConversionStatus.InQueue,
				externalConversionId,
				workerConversionId: null
			})
			return {
				conversionId: externalConversionId
			}
		}
		catch (error) {
			return handleError(error)
		}
	}
	/**
	 * LEGACY VERSION - will be deprecated in the future
	 * Adds the file from the request body to the internal conversion queue.
	 * The files in queue will be processed after the FIFO principle.
	 * @param conversionRequestBody	contains the file to convert
	 */
	@Post("/")
	@Deprecated()
	public async convertFileLegacy(
		@Body() requestBody: IConversionRequestBody
	): Promise<IConversionProcessingResponse | IUnsupportedConversionFormatError> {
		try {
			if (!requestBody) {
				throw new InvalidRequestBodyError()
			}
			const {
				originalFormat,
				filename,
				file,
				targetFormat
			} = requestBody
			const externalConversionId = uuidV4()
			const ext = getExt(filename, originalFormat)
			await writeToFile(join("input", `${externalConversionId}${ext}`), file)
			await this.redisService.addRequestToQueue({
				conversionRequestBody: {
					file: "",
					filename,
					originalFormat,
					targetFormat
				},
				conversionStatus: EConversionStatus.InQueue,
				externalConversionId,
				workerConversionId: null
			})
			return {
				conversionId: externalConversionId
			}
		}
		catch (error) {
			return handleError(error)
		}
	}
	/**
	 * Retrieves the status of the conversion queue and returns all conversions with
	 * their corresponding status and the amount of outstanding conversions.
	 */
	@Get("/")
	public async getConversionQueueStatus(): Promise<IConversionQueueStatus> {
		try {
			const requests = [
				...this.redisService.getRequests(),
				...this.redisService.getFinishedRequests()
			]
			const conversions: IConversionStatus[] = []
			for (const request of requests) {
				conversions.push({
					conversionId: request.externalConversionId,
					path: request.conversionRequestBody.filename,
					retries: 0,
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					sourceFormat: request.conversionRequestBody.originalFormat!,
					status: assertStatus(request.conversionStatus),
					targetFormat: request.conversionRequestBody.targetFormat
				})
			}
			const inProcessConversions = conversions.length
			const inQueueConversions = await this.redisService.getPendingRequestCount()
			return {
				conversions,
				remainingConversions: inProcessConversions + inQueueConversions
			}
		}
		catch (error) {
			return {
				conversions: [],
				remainingConversions: 0
			}
		}
	}
	/**
	 * Returns the current status for a conversion given a conversionId
	 * @param conversionId Unique identifier for the conversion of a file.
	 */
	@Get("{conversionId}")
	public getConvertedFile(
		@Query("v2") isV2Request: boolean = false,
		@Path() conversionId: string,
		@Request() req: express.Request
	): IConversionStatus {
		try {
			const conversionRequest = this.redisService.getConversionResult(conversionId)
			if (!conversionRequest) {
				throw new Error(`Conversion with id ${conversionId} not found`)
			}
			const {
				targetFormat,
				originalFormat
			} = conversionRequest.conversionRequestBody
			if (
				conversionRequest.conversionStatus === "converted"
				&& !isV2Request
			) {
				const ext = targetFormat.startsWith(".")
					? targetFormat
					: `.${targetFormat}`
				const filePath = `./output/${conversionId}${ext}`
				const stats = readFromFileSync(filePath)
				const response: TApiConvertedCompatResponseV1 = {
					conversionId,
					failures: 0,
					path: filePath,
					resultFile: stats,
					retries: 0,
					sourceFormat: originalFormat ?? "",
					status: assertStatus(EConversionStatus.Converted),
					targetFormat
				}
				return response
			}
			return {
				conversionId,
				path: "",
				retries: 0,
				sourceFormat: originalFormat ?? "",
				status: assertStatus(conversionRequest.conversionStatus),
				targetFormat
			}
		}
		catch (err) {
			this.setStatus(EHttpResponseCodes.notFound)
			// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
			return {
				conversionId,
				status: err.message
			} as IConversionStatus
		}
	}
	/**
	 * Returns the current status for a conversion given a conversionId
	 * If status is 'converted' the resulting converted file
	 * will be available to download.
	 * @param conversionId the id of the file-conversion that is requested
	 */
	// eslint-disable-next-line @typescript-eslint/require-await
	@Get("{conversionId}/download")
	public async getConvertedFileDownload(
		@Path("conversionId") conversionId: string
	): Promise<unknown> {
		try {
			const conversionRequest = this.redisService.getConversionResult(conversionId)
			if (!conversionRequest) {
				throw new Error(`Conversion with id ${conversionId} not found`)
			}
			if (conversionRequest.conversionStatus === EConversionStatus.Converted) {
				const {
					filename,
					targetFormat
				} = conversionRequest.conversionRequestBody
				const ext = targetFormat.startsWith(".")
					? targetFormat
					: `.${targetFormat}`
				const filePath = `./output/${conversionId}${ext}`
				const stats = await fs.promises.stat(filePath)
				this.setHeader("Content-Type", `${getType(filePath)}`)
				this.setHeader("Content-Length", stats.size.toString())
				this.setHeader("Content-Disposition", `attachment; filename=${conversionId}${ext}`)
				return fs.createReadStream(filePath)
			}
			return {
				conversionId,
				status: conversionRequest.conversionStatus
			}
		}
		catch (err) {
			this.setStatus(EHttpResponseCodes.notFound)
			return {
				conversionId,
				status: err.message
			}
		}
	}
}