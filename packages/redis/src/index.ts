import { IRedisServiceConfiguration } from "./config"
import { RedisWrapper } from "./wrapper"
export class RedisService {
	private readonly config: IRedisServiceConfiguration
	private readonly redisWrapper: RedisWrapper
	constructor(config: IRedisServiceConfiguration) {
		this.config = config
		this.redisWrapper = new RedisWrapper(this.config.redisConfig)
	}
	public readonly initialize = async () : Promise<void> => {
		await this.redisWrapper.init()
	}
	public readonly quit = async () : Promise<void> => {
		await this.redisWrapper.quit()
	}
	public readonly receive = async () :Promise<string> => {
		return await this.redisWrapper.receiveMessage()
	}
	public readonly send = async (message:string) :Promise<void> => {
		await this.redisWrapper.sendMessage(message)
	}
}