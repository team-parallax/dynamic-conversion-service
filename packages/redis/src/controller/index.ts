import { Container } from "typescript-ioc"
import {
	Controller,
	Example,
	Get,
	Route,
	Tags
} from "tsoa"
import { EHttpResponseCodes } from "conversion-service/src/constants"
import { IApiConversionFormatResponse } from "../api/conversion-client"
import { RedisService } from "../service"
@Route("/")
export class IndexController extends Controller {
	private readonly redisService: RedisService = Container.get(RedisService)
	@Tags("Misc.")
	@Get("/ping")
	@Example<string>("pong")
	public getPingResponse(): string {
		const hasWorker = this.redisService.hasWorker()
		if (hasWorker) {
			this.setStatus(EHttpResponseCodes.ok)
			return "pong"
		}
		this.setStatus(EHttpResponseCodes.unavailable)
		return "no worker available"
	}
	@Tags("Conversion-Formats")
	@Get("/formats")
	public async getSupportedConversionFormats(): Promise<IApiConversionFormatResponse> {
		return await this.redisService.getFormats()
	}
}