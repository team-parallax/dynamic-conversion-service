import { IRedisServiceConfiguration } from "./config"
import { RedisNotInitializedError } from "./exception"
import { RedisWrapper } from "./wrapper"
export class RedisService {
	private readonly config: IRedisServiceConfiguration
	private isInitialized: boolean = false
	private readonly redisWrapper: RedisWrapper
	constructor(config: IRedisServiceConfiguration) {
		this.config = config
		this.redisWrapper = new RedisWrapper(this.config.redisConfig)
	}
	public readonly initialize = async () : Promise<void> => {
		await this.redisWrapper.init()
		this.isInitialized = true
	}
	public readonly popMessage = async () : Promise<string> => {
		if (!this.isInitialized) {
			throw new RedisNotInitializedError()
		}
		return await this.redisWrapper.popMessage()
	}
	public readonly quit = async () : Promise<void> => {
		await this.redisWrapper.quit()
	}
	public readonly receive = async () :Promise<string> => {
		if (!this.isInitialized) {
			throw new RedisNotInitializedError()
		}
		return await this.redisWrapper.receiveMessage()
	}
	public readonly send = async (message:string) :Promise<void> => {
		if (!this.isInitialized) {
			throw new RedisNotInitializedError()
		}
		await this.redisWrapper.sendMessage(message)
	}
}