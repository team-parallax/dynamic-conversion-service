import { ELogLevel } from "./enum"
export interface ILoggerOptions {
	fileOnly?: string,
	logLevel?: ELogLevel,
	serviceName?: string
}