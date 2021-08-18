import { AutoScaler } from "auto-scaler"
import { IRedisServiceConfiguration, getRedisConfigFromEnv } from "./config"
import { Logger } from "../../logger"
import { RedisWrapper } from "./wrapper"
export class RedisService {
	private readonly autoScaler: AutoScaler
	private readonly config: IRedisServiceConfiguration
	private readonly logger: Logger
	private readonly redisWrapper: RedisWrapper
	private readonly runningContainers: Map<string, boolean>
	constructor() {
		this.config = getRedisConfigFromEnv()
		this.logger = new Logger({
			serviceName: "redis-service"
		})
		const {
			autoScalerConfig,
			redisConfig
		} = this.config
		this.redisWrapper = new RedisWrapper(redisConfig, this.logger)
		this.autoScaler = new AutoScaler(autoScalerConfig)
		this.runningContainers = new Map()
	}
	readonly checkHealth = async (): Promise<void> => {
		const pendingRequests = await this.redisWrapper.getPendingMessagesCount()
		const containerStatus = await this.autoScaler.checkContainerStatus(pendingRequests)
		const {
			runningContainers,
			containersToRemove,
			containersToStart
		} = containerStatus
		this.logger.info(`${runningContainers.length} are currently running`)
		this.logger.info(`start/remove : ${containersToStart}/${containersToRemove}`)
		runningContainers.forEach(container => {
			this.runningContainers.set(container.containerId, true)
		})
		this.logger.info("applying scaling...")
		const {
			startedContainers,
			removedContainers
		} = await this.autoScaler.applyConfigurationState(containerStatus)
		startedContainers.forEach(container => {
			this.runningContainers.set(container.containerId, true)
		})
		removedContainers.forEach(container => {
			this.runningContainers.delete(container.containerId)
		})
	}
	// This is a pending placeholder for actual interfaces
	readonly forwardRequest = async (request: number): Promise<void> => {
		await this.redisWrapper.sendMessage(JSON.stringify(request))
	}
	readonly initalize = async (): Promise<void> => {
		await this.redisWrapper.initialize()
	}
	readonly quit = async (): Promise<void> => {
		await this.redisWrapper.quit()
	}
}