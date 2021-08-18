import { ELogLevel } from "../src/enum"
import { Logger } from "../../logger/src/index"
describe("Logger should pass all tests", () => {
	it("should instantiate a default logger", () => {
		/* Arrange */
		const logger = new Logger()
		/* Assert */
		expect(logger).toBeDefined()
		expect(() => logger.info("hello world")).not.toThrow()
	})
	it("should instatiate a logger with debug logLevel set", () => {
		const logger = new Logger({
			logLevel: ELogLevel.debug
		})
		/* Assert */
		expect(logger).toBeDefined()
		expect(() => logger.debug("debug message output")).not.toThrow()
	})
	it("should instantiate a logger with service name and debug level", () => {
		/* Arrange */
		const loggerServiceName = "auto-scaler"
		const logger = new Logger({
			logLevel: ELogLevel.debug,
			serviceName: loggerServiceName
		})
		/* Assert */
		expect(logger).toBeDefined()
		expect(() => logger.debug(`debug log from ${loggerServiceName}-service-logger`)).not.toThrow()
	})
	it("should change the Logger name correctly", () => {
		/* Arrange */
		const changedLoggerServiceName = "auto-scaler"
		const logger = new Logger()
		logger.info("Demo Log for test-case with service-rename BEFORE")
		/* Act */
		logger.changeServiceName(changedLoggerServiceName)
		logger.info("Demo Log for test-case with service-rename AFTER")
		const newLoggerServiceName = logger.serviceName
		/* Assert */
		expect(newLoggerServiceName).toEqual(changedLoggerServiceName)
	})
})