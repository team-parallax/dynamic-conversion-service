import { IRedisConfiguration } from "../config"
import { Logger } from "logger"
import {
	RedisWrapperNotInitializedError,
	RedisWrapperPopError,
	RedisWrapperQueueCreateError,
	RedisWrapperQueueDeleteError,
	RedisWrapperQueueListError,
	RedisWrapperQueueStatError,
	RedisWrapperSendError,
	RedisWrapperTimoutError
} from "./exception"
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
		this.rsmq = new RedisSMQ({
			host,
			ns: namespace,
			port
		})
		this.logger.info("established redis connection")
	}
	readonly getPendingMessagesCount = async (): Promise<number> => {
		if (!this.isInitialized) {
			this.logger.error(`using 'getPendingMessagesCount' before initializing`)
			throw new RedisWrapperNotInitializedError()
		}
		return new Promise((resolve, reject) => {
			this.rsmq.getQueueAttributes({
				qname: this.config.queue
			}, (err, resp) => {
				if (err) {
					this.logger.error(err)
					return reject(new RedisWrapperQueueStatError())
				}
				return resolve(resp.msgs)
			})
		})
	}
	readonly initialize = async (): Promise<void> => {
		const ms = 1000
		const timeout = async (s: number):Promise<void> => new Promise((resolve, reject) => {
			global.setTimeout(resolve, s * ms)
		})
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		global.setTimeout(async ():Promise<void> => {
			const existingQueues = await this.getQueues()
			const {
				queue
			} = this.config
			if (!existingQueues.includes(queue)) {
				await this.createQueue(queue)
			}
			else {
				this.logger.info(`found existing queue with name: ${queue}. Removing...`)
				await this.deleteQueue(queue)
				await this.createQueue(queue)
			}
			this.isInitialized = true
		})
		const timeoutInSeconds = 5
		await timeout(timeoutInSeconds)
		if (!this.isInitialized) {
			throw new RedisWrapperTimoutError()
		}
		this.logger.info("redis-wrapper initialized")
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