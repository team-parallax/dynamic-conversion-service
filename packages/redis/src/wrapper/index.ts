import { IRedisConfiguration } from "../config"
import { Logger } from "~/../packages/logger"
import {
	RedisWrapperPopError,
	RedisWrapperQueueCreateError,
	RedisWrapperQueueDeleteError,
	RedisWrapperQueueListError,
	RedisWrapperReceiveError,
	RedisWrapperSendError
} from "./exception"
import RedisSMQ, { QueueMessage } from "rsmq"
export class RedisWrapper {
	private readonly config: IRedisConfiguration
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
	}
	readonly init = async (): Promise<void> => {
		const existingQueues = await this.getQueues()
		const {
			queue
		} = this.config
		if (!existingQueues.includes(queue)) {
			await this.createQueue(queue)
		}
	}
	readonly popMessage = async (): Promise<string> => {
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
		return new Promise((resolve, reject) => {
			this.rsmq.receiveMessage({
				qname: this.config.queue
			}, (err, resp) => {
				if (err) {
					this.logger.error(err)
					return reject(new RedisWrapperReceiveError())
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
					this.logger.info(`created queue : ${queue}`)
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
					this.logger.info(`deleted queue : ${queue}`)
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
				return resolve(queues)
			})
		})
	}
}