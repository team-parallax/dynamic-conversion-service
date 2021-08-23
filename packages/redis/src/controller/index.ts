import { Container, Inject } from "typescript-ioc"
import {
	Controller,
	Example,
	Get,
	Route,
	Tags
} from "tsoa"
import { EHttpResponseCodes } from "conversion-service/src/constants"
import { IApiConversionFormatResponse } from "../api/conversion-client"
import { Logger } from "logger"
import { RedisService } from "../service"
@Route("/")
export class IndexController extends Controller {
	@Inject
	private readonly logger!: Logger
	private readonly redisService: RedisService = Container.get(RedisService)
	@Tags("Misc.")
	@Get("/ping")
	@Example<string>("pong")
	public getPingResponse(): string {
		this.logger.info("Received 'ping' signal.")
		/* TODO: check if there is at least one worker node */
		this.setStatus(EHttpResponseCodes.ok)
		return "pong"
	}
	@Tags("Conversion-Formats")
	@Get("/formats")
	public async getSupportedConversionFormats(): Promise<IApiConversionFormatResponse> {
		this.logger.info("Conversion formats requested")
		return new Promise<IApiConversionFormatResponse>((resolve, reject) => {
			reject("Not implemented yet")
		})
	}
}