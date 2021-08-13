import { IRedisServiceConfiguration } from "./config"
import { Logger } from "../../logger"
import { RedisNotInitializedError } from "./exception"
import { RedisWrapper } from "./wrapper"
export class RedisService {
	private readonly config: IRedisServiceConfiguration
	private isInitialized: boolean = false
	private readonly logger: Logger
	private readonly redisWrapper: RedisWrapper
	constructor(config: IRedisServiceConfiguration) {
		this.config = config
		this.logger = new Logger("redis-service")
		this.redisWrapper = new RedisWrapper(this.config.redisConfig, this.logger)
	}
	public readonly initialize = async (): Promise<void> => {
		await this.redisWrapper.init()
		this.isInitialized = true
		this.logger.info("successfully initialized redis-service")
	}
	public readonly popMessage = async (): Promise<string> => {
		if (!this.isInitialized) {
			this.logger.error(`using 'popMessage' before initializing`)
			throw new RedisNotInitializedError()
		}
		return await this.redisWrapper.popMessage()
	}
	public readonly quit = async (): Promise<void> => {
		await this.redisWrapper.quit()
		this.logger.info("successfully terminated redis-service")
	}
	public readonly receive = async (): Promise<string> => {
		if (!this.isInitialized) {
			this.logger.error(`using 'receive' before initializing`)
			throw new RedisNotInitializedError()
		}
		return await this.redisWrapper.receiveMessage()
	}
	public readonly send = async (message: string): Promise<void> => {
		if (!this.isInitialized) {
			this.logger.error(`using 'send' before initializing`)
			throw new RedisNotInitializedError()
		}
		await this.redisWrapper.sendMessage(message)
	}
}