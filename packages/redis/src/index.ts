import { AutoScaler } from "auto-scaler"
import { IContainerCheck } from "./interface"
import { IContainerInfo } from "auto-scaler/src/docker/interface"
import { IContainerStateChange } from "auto-scaler/src/interface"
import { IRedisServiceConfiguration, getRedisConfigFromEnv } from "./config"
import { Logger } from "../../logger"
import { RedisWrapper } from "./wrapper"
export class RedisService {
	private readonly autoScaler: AutoScaler
	private readonly config: IRedisServiceConfiguration
	private readonly logger: Logger
	private readonly redisWrapper: RedisWrapper
	private readonly runningWorkers: Map<string, IContainerInfo>
	constructor() {
		this.config = getRedisConfigFromEnv()
		this.logger = new Logger("redis-service")
		const {
			autoScalerConfig,
			redisConfig
		} = this.config
		this.redisWrapper = new RedisWrapper(redisConfig, this.logger)
		this.autoScaler = new AutoScaler(autoScalerConfig)
		this.runningWorkers = new Map()
	}
	readonly checkHealth = async (): Promise<void> => {
		const pendingRequests = await this.redisWrapper.getPendingMessagesCount()
		const containerStatus = await this.autoScaler.checkContainerStatus(pendingRequests)
		const result = await this.autoScaler.applyConfigurationState(containerStatus)
		await this.updateActiveWorkers(result)
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
	private readonly pingWorker = async (worker: any): Promise<boolean> => {
		// Worker.ping
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		await new Promise((resolve, reject) => setTimeout(resolve, 100))
		return true
	}
	private readonly updateActiveWorkers = async ({
		removedContainers,
		startedContainers
	}: IContainerStateChange): Promise<void> => {
		removedContainers.forEach(container =>
			this.runningWorkers.delete(container.containerId))
		const pingChecks = startedContainers.map(
			async (container): Promise<IContainerCheck> => ({
				containerInfo: container,
				isRunning: await this.pingWorker(container)
			})
		)
		const containerChecks = await Promise.all(pingChecks)
		const runningContainers = containerChecks
			.filter(check => check.isRunning)
		// What do we do with started container which do not respond?
		runningContainers.forEach(containerCheck =>
			this.runningWorkers.set(
				containerCheck.containerInfo.containerId,
				containerCheck.containerInfo
			))
	}
}