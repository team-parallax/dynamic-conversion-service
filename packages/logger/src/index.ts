import { ELogLevel } from "./enum"
import { ILoggerOptions } from "./interface"
import {
	Logger as WinstonLogger,
	createLogger,
	format,
	transports
} from "winston"
const {
	combine,
	colorize,
	printf,
	timestamp
} = format
export class Logger {
	private readonly defaultIndentation: number = 2
	private readonly logger: WinstonLogger
	private loggerServiceName: string
	constructor(loggerOptions?: ILoggerOptions) {
		const {
			logLevel = ELogLevel.info,
			serviceName = "default-logger"
		} = loggerOptions as ILoggerOptions
		this.loggerServiceName = serviceName
		const customFormat = printf(
			({
				level, message, timestamp
			}) => {
				return `=====\n[${level.toUpperCase()}]\t[${this.loggerServiceName}] [${timestamp}]\n-----\n${message}\n=====`
			}
		)
		this.logger = createLogger({
			defaultMeta: {
				service: this.loggerServiceName
			},
			format: combine(
				timestamp({
					format: "DD-MM-YYYY - HH:mm:ss"
				}),
				customFormat
			),
			level: logLevel,
			transports: [
				new transports.Console()
			]
		})
	}
	addLogFile = (logFilename: string, level?: string): void => {
		this.logger.transports.push(
			new transports.File({
				filename: logFilename,
				level: level ?? "info"
			})
		)
	}
	changeServiceName = (newName: string): void => {
		const {
			serviceName: currentServiceName
		} = this.logger.defaultMeta
		const newServiceName = newName.length > 0
			? newName
			: currentServiceName
		this.loggerServiceName = newServiceName
		if (newServiceName !== newName) {
			this.debug(`New Service name is empty - keeping ${currentServiceName}`)
			return
		}
		this.logger.debug(`New service name set to: ${newName}`)
	}
	critical = (message: any): void => {
		this.logger.crit(JSON.stringify(message, null, this.defaultIndentation))
	}
	debug = (message: any): void => {
		this.logger.debug(JSON.stringify(message, null, this.defaultIndentation))
	}
	error = (message: any): void => {
		this.logger.error(JSON.stringify(message, null, this.defaultIndentation))
	}
	info = (message: any): void => {
		this.logger.info(JSON.stringify(message, null, this.defaultIndentation))
	}
	get serviceName(): string {
		return this.loggerServiceName
	}
}