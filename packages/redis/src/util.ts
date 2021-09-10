import {
	EConversionStatus,
	IApiConversionFormatResponse,
	IConversionStatus
} from "./api/conversion-client"
import {
	FormatRetrievalError,
	InvalidFormatError,
	RequestFormatError,
	StatusUpdateError
} from "./exception"
import { IConversionRequest } from "./interface"
import { TDockerHealthStatus } from "auto-scaler/src/docker/type"
import { createWriteStream } from "fs"
import { deleteFile, readFileToBuffer } from "conversion-service/src/service/file-io"
import {
	extname,
	join
} from "path"
import FormData from "form-data"
import fetch from "node-fetch"
export const wait = async (duration: number): Promise<void> => {
	return await new Promise((resolve, reject) => setTimeout(resolve, duration))
}
export const pingWorker = async (workerUrl: string): Promise<boolean> => {
	try {
		const resp = await fetch(`${workerUrl}/ping`)
		const respText = await resp.text()
		return respText === "\"pong\""
	}
	catch (error) {
		return false
	}
}
export const getFormatsFromWorker = async (workerUrl:string)
: Promise<IApiConversionFormatResponse | undefined> => {
	try {
		const resp = await fetch(`${workerUrl}/formats`)
		return await resp.json() as IApiConversionFormatResponse
	}
	catch (error) {
		throw new FormatRetrievalError(workerUrl)
	}
}
export const forwardRequestToWorker = async (
	workerUrl:string,
	request: IConversionRequest): Promise<string> => {
	const {
		originalFormat,
		targetFormat,
		filename
	} = request.conversionRequestBody
	let ext = ""
	ext = getExt(filename, originalFormat)
	if (ext === "") {
		throw new InvalidFormatError(filename, originalFormat)
	}
	const fileLocation = join("input", request.externalConversionId + ext)
	const buffer = await readFileToBuffer(fileLocation)
	const formData = new FormData()
	formData.append("conversionFile", buffer, {
		filename,
		filepath: fileLocation
	})
	formData.append("originalFormat", originalFormat ?? filename.split(".")[1])
	formData.append("targetFormat", targetFormat)
	try {
		const resp = await fetch(`${workerUrl}/conversion/v2`, {
			body: formData,
			method: "POST"
		})
		const statusReponse = await resp.json() as {conversionId: string}
		return statusReponse.conversionId
	}
	catch (error) {
		throw new RequestFormatError(workerUrl)
	}
}
export const getConversionStatus = async (workerUrl:string, conversionId:string):
 Promise<EConversionStatus> => {
	try {
		const resp = await fetch(`${workerUrl}/conversion/${conversionId}?v2=true`)
		const statusResponse = await resp.json() as IConversionStatus
		return statusResponse.status
	}
	catch (error) {
		throw new StatusUpdateError(workerUrl)
	}
}
export const getFileFromWorker = async (
	workerUrl: string,
	workerConversionId: string,
	externalConversionId: string,
	targetFormat: string
): Promise<void> => {
	const resp = await fetch(`${workerUrl}/conversion/${workerConversionId}/download`)
	let format = targetFormat
	if (!format.startsWith(".")) {
		format = `.${targetFormat}`
	}
	const outputFile = join("output", `${externalConversionId}${format}`)
	const outStream = createWriteStream(outputFile)
	resp.body.pipe(outStream)
}
export const getExtFromFormat = (format?: string): string => {
	if (!format) {
		return ""
	}
	return format.startsWith(".")
		? format
		: `.${format}`
}
export const getExtFromFilename = (filename: string): string => {
	return extname(filename)
}
export const getExt = (filename: string, format?: string): string => {
	let ext = getExtFromFormat(format)
	if (ext === "") {
		ext = getExtFromFilename(filename)
	}
	if (ext === "") {
		throw new InvalidFormatError(filename, format)
	}
	return ext
}
export const isHealthy = (containerHealthStatus: TDockerHealthStatus): boolean => {
	return containerHealthStatus === "healthy"
}
export const isUnhealthy = (containerHealthStatus: TDockerHealthStatus): boolean => {
	return !isHealthy(containerHealthStatus)
}
export const isStartingOrHealthy = (containerHealthStatus: TDockerHealthStatus): boolean => {
	return isHealthy(containerHealthStatus) || containerHealthStatus === "starting"
}
export const removeRequestFile = async (
	dir: "input" | "output",
	request: IConversionRequest
): Promise<string> => {
	const deleteFileExtension = dir === "input"
		? request.conversionRequestBody.originalFormat
		: request.conversionRequestBody.targetFormat
	const ext = getExtFromFormat()
	const targetPath = join(dir, request.externalConversionId + ext)
	await deleteFile(targetPath)
	return targetPath
}