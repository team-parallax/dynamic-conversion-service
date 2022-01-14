import { IRedisConfiguration } from "../config"
import { Logger } from "logger"
import {
	RedisWrapperNotInitializedError,
	RedisWrapperOperationTimeoutError,
	RedisWrapperPopError,
	RedisWrapperQueueCreateError,
	RedisWrapperQueueDeleteError,
	RedisWrapperQueueListError,
	RedisWrapperQueueStatError,
	RedisWrapperSendError,
	RedisWrapperTimoutError
} from "./exception"
import { withTimeout } from "./util"
const responseFailure = -1
const queueIsMissing = -2
const operationTimeout = 2500
import RedisSMQ, { QueueMessage } from "rsmq"
export class RedisWrapper {
	private readonly config: IRedisConfiguration
	private isInitialized: boolean = false
	private readonly logger: Logger
	private readonly rsmq : RedisSMQ
	constructor(config: IRedisConfiguration, logger: Logger) {
		this.logger = logger
		this.config = config
		const {
			host, port, namespace
		} = this.config
		this.logger.info(`connecting to redis on ${host}:${port}`)
		this.rsmq = new RedisSMQ({
			host,
			ns: namespace,
			port
		})
	}
	readonly getPendingMessagesCount = async (): Promise<number> => {
		if (!this.isInitialized) {
			this.logger.error(`using 'getPendingMessagesCount' before initializing`)
			throw new RedisWrapperNotInitializedError()
		}
		const getQueueDepth = async (): Promise<number> =>
			await new Promise<number>((resolve, reject) => {
				this.rsmq.getQueueAttributes({
					qname: this.config.queue
				}, (err, resp) => {
					if (err) {
						this.logger.error(err)
						if (err.name === "queueNotFound") {
							return resolve(queueIsMissing)
						}
						return reject(new RedisWrapperQueueStatError())
					}
					return resolve(resp.msgs)
				})
			})
		// Const queueDepth = responseFailure
		const p = await withTimeout(operationTimeout, getQueueDepth()) as number
		if (p === queueIsMissing) {
			await this.createQueue(this.config.queue)
			return 0
		}
		else if (p === responseFailure) {
			throw new RedisWrapperOperationTimeoutError("get-queue-depth")
		}
		else {
			return p
		}
	}
	readonly initialize = async (): Promise<void> => {
		this.logger.info("initializing redis-wrapper")
		const ensureQueue = async (): Promise<number> => {
			try {
				const existingQueues = await this.getQueues()
				const {
					queue
				} = this.config
				if (existingQueues.includes(queue)) {
					this.logger.info(`found existing queue with name: ${queue}. Removing...`)
					await this.deleteQueue(queue)
				}
				this.logger.info(`create queue with name: ${queue}.`)
				await this.createQueue(queue)
				return 1
			}
			catch (error) {
				return -1
			}
		}
		this.logger.info(`waiting ${operationTimeout}ms for redis connection`)
		const res = await withTimeout(operationTimeout, ensureQueue()) as number
		if (res === responseFailure) {
			throw new RedisWrapperTimoutError(operationTimeout)
		}
		this.logger.info("redis-wrapper connected to redis-server")
		this.isInitialized = true
		this.logger.info("successfully initialized redis wrapper")
	}
	readonly quit = async (): Promise<void> => {
		const runningQueues = await this.getQueues()
		const {
			queue
		} = this.config
		if (runningQueues.includes(queue)) {
			await this.deleteQueue(queue)
		}
		this.rsmq.quit()
	}
	readonly receiveMessage = async (): Promise<string> => {
		if (!this.isInitialized) {
			this.logger.error(`using 'receiveMessage' before initializing`)
			throw new RedisWrapperNotInitializedError()
		}
		return new Promise((resolve, reject) => {
			this.rsmq.popMessage({
				qname: this.config.queue
			}, (err, resp) => {
				if (err) {
					this.logger.error(err)
					return reject(new RedisWrapperPopError())
				}
				if (resp === {}) {
					return resolve("")
				}
				else {
					return resolve((resp as QueueMessage).message)
				}
			})
		})
	}
	readonly sendMessage = async (message: string): Promise<void> => {
		if (!this.isInitialized) {
			this.logger.error(`using 'send' before initializing`)
			throw new RedisWrapperNotInitializedError()
		}
		return new Promise((resolve, reject) => {
			this.rsmq.sendMessage({
				message,
				qname: this.config.queue
			}, (err, resp) => {
				if (err) {
					this.logger.error(err)
					return reject(new RedisWrapperSendError())
				}
				if (resp) {
					return resolve()
				}
				return reject()
			})
		})
	}
	private readonly createQueue = async (queue: string): Promise<void> => {
		return new Promise((resolve, reject) => {
			this.rsmq.createQueue({
				qname: queue
			}, (err, resp) => {
				if (err) {
					this.logger.error(err)
					return reject(new RedisWrapperQueueCreateError(queue))
				}
				if (resp === 1) {
					this.logger.info(`created queue: ${queue}`)
					return resolve()
				}
				return reject()
			})
		})
	}
	private readonly deleteQueue = async (queue: string): Promise<void> => {
		return new Promise((resolve, reject) => {
			this.rsmq.deleteQueue({
				qname: queue
			}, (err, resp) => {
				if (err) {
					this.logger.error(err)
					return reject(new RedisWrapperQueueDeleteError(queue))
				}
				if (resp === 1) {
					this.logger.info(`deleted queue: ${queue}`)
					return resolve()
				}
				return reject()
			})
		})
	}
	private readonly getQueues = async (): Promise<string[]> => {
		return new Promise((resolve, reject) => {
			this.rsmq.listQueues((err, queues) => {
				if (err) {
					this.logger.error(err)
					return reject(new RedisWrapperQueueListError())
				}
				this.logger.debug(`found ${queues.length} redis-queues`)
				return resolve(queues)
			})
		})
	}
}