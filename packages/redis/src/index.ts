import { AutoScaler } from "auto-scaler"
import { IRedisServiceConfiguration } from "./config"
import { Logger } from "../../logger"
import { RedisWrapper } from "./wrapper"
import { getAutoScalerConfigFromEnv } from "./config"
export class RedisService {
	private readonly autoScaler: AutoScaler
	private readonly config: IRedisServiceConfiguration
	private readonly logger: Logger
	private readonly redisWrapper: RedisWrapper
	constructor(config: IRedisServiceConfiguration) {
		this.config = config
		this.logger = new Logger("redis-service")
		this.redisWrapper = new RedisWrapper(this.config.redisConfig, this.logger)
		this.autoScaler = new AutoScaler(getAutoScalerConfigFromEnv())
	}
}