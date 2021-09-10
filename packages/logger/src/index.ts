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
		let logLevel = ELogLevel.info
		let serviceName = "default-logger"
		if (loggerOptions) {
			logLevel = loggerOptions.logLevel ?? ELogLevel.info
			serviceName = loggerOptions.serviceName ?? "default-logger"
		}
		this.loggerServiceName = serviceName
		const customFormat = printf(
			({
				level, message, timestamp
			}) => {
				return `[${level.toUpperCase()}][${this.loggerServiceName}][${timestamp}] :: ${message}`
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
		this.logger.crit(this.trimQuotes(JSON.stringify(message, null, this.defaultIndentation)))
	}
	debug = (message: any): void => {
		this.logger.debug(this.trimQuotes(JSON.stringify(message, null, this.defaultIndentation)))
	}
	error = (message: any): void => {
		this.logger.error(this.trimQuotes(JSON.stringify(message, null, this.defaultIndentation)))
	}
	info = (message: any): void => {
		this.logger.info(this.trimQuotes(JSON.stringify(message, null, this.defaultIndentation)))
	}
	get serviceName(): string {
		return this.loggerServiceName
	}
	private readonly trimQuotes = (message: string): string => {
		return message.slice(1, message.length - 1)
	}
}