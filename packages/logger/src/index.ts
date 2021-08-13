import { ELogLevel } from "./enum"
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
	private readonly loggerServiceName: string
	constructor(
		serviceName?: string,
		logLevel: ELogLevel = ELogLevel.info
	) {
		this.loggerServiceName = serviceName ?? "conversion-service"
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
}