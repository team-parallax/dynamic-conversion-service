import {
	EConversionStatus, IApiConversionFormatResponse, IConversionStatus
} from "./api/conversion-client"
import { IConversionRequest } from "./interface"
import { InvalidFormatError } from "./exception"
import { createWriteStream } from "fs"
import { join } from "path"
import { readFileToBuffer } from "conversion-service/src/service/file-io"
import FormData from "form-data"
import fetch from "node-fetch"
export const wait = async (duration: number): Promise<void> => {
	return await new Promise((resolve, reject) => setTimeout(resolve, duration))
}
export const pingWorker = async (workerUrl: string): Promise<boolean> => {
	const response = await fetch(`${workerUrl}/ping`)
		.then(async r => r.text())
		.catch(() => "not pong")
	return response === "\"pong\""
}
export const getFormatsFromWorker = async (workerUrl:string)
: Promise<IApiConversionFormatResponse | undefined> => {
	return await fetch(`${workerUrl}/formats`)
		.then(async r => r.json())
		.then(formats => formats as IApiConversionFormatResponse)
		.catch(() => undefined)
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
	const resp = await fetch(`${workerUrl}/conversion/v2`, {
		body: formData,
		method: "POST"
	}).then(async r => r.json())
		.then(conversionId => conversionId as {conversionId: string})
	return resp.conversionId
}
export const getConversionStatus = async (workerUrl:string, conversionId:string):
 Promise<EConversionStatus> => {
	return await fetch(`${workerUrl}/conversion/${conversionId}?v2=true`)
		.then(async r => r.json())
		.then(status => (status as IConversionStatus).status)
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
	return filename.includes(".")
		? `.${filename.split(".")[1]}`
		: ""
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
export const isHealthy = (containerStatus: string): boolean => {
	return containerStatus.includes("Up") && containerStatus.includes("healthy")
}
export const isUnhealthy = (containerStatus: string): boolean => {
	return containerStatus.includes("Exited") || containerStatus.includes("unhealthy")
}