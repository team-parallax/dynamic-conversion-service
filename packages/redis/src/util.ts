import { IApiConversionFormatResponse, IConversionStatus } from "./api/conversion-client"
import { IConversionRequest } from "./interface"
import { join } from "path"
import { readFileToBuffer } from "conversion-service/src/service/file-io"
import FormData from "form-data"
import fetch from "node-fetch"
export const wait = async (duration: number): Promise<void> => {
	return await new Promise((resolve, reject) => setTimeout(resolve, duration))
}
export const pingWorker = async (workerIp: string): Promise<boolean> => {
	const response = await fetch(`http://${workerIp}:3000/ping`)
		.then(async r => r.text())
		.catch(() => "not pong")
	return response === "\"pong\""
}
export const getFormatsFromWorker = async (workerIp:string)
: Promise<IApiConversionFormatResponse | undefined> => {
	return await fetch(`http://${workerIp}:3000/formats`)
		.then(async r => r.json())
		.then(formats => formats as IApiConversionFormatResponse)
		.catch(() => undefined)
}
export const forwardRequestToWorker = async (
	workerIp:string,
	request: IConversionRequest): Promise<string> => {
	const {
		originalFormat,
		targetFormat,
		filename
	} = request.conversionRequestBody
	const fileLocation = join("input", request.externalConversionId, filename)
	const buffer = await readFileToBuffer(fileLocation)
	const formData = new FormData()
	formData.append("conversionFile", buffer, {
		filename,
		filepath: fileLocation
	})
	formData.append("originalFormat", originalFormat ?? filename.split(".")[1])
	formData.append("targetFormat", targetFormat)
	const resp = await fetch(`http://${workerIp}:3000/conversion/v2`, {
		body: formData,
		method: "POST"
	}).then(async r => r.json())
		.then(conversionId => conversionId as {conversionId: string})
	return resp.conversionId
}
export const getConversionStatus = async (workerIp:string, conversionId:string):
 Promise<IConversionStatus> => {
	return await fetch(`http://${workerIp}:3000/conversion/${conversionId}?v2=true`)
		.then(async r => r.json())
		.then(status => status as IConversionStatus)
}