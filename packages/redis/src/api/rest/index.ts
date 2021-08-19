import { EHttpResponseCodes } from "conversion-service/src/constants"
import { Inject } from "typescript-ioc"
import { Logger } from "logger"
import { RegisterRoutes } from "conversion-service/src/routes/routes"
import { ValidateError } from "tsoa"
import { createDirectoryIfNotPresent } from "conversion-service/src/service/file-io"
import { generateHTML, serve } from "swagger-ui-express"
import { join } from "path"
import cors from "cors"
import express, {
	Application,
	Express,
	NextFunction,
	Request,
	Response,
	json,
	urlencoded
} from "express"
import swaggerDocument from "conversion-service/swagger.json"
export class Api {
	@Inject
	private readonly logger!: Logger
	public readonly app: Application
	private readonly _port: number = 8000
	private readonly startUpDelay: number = 1500
	constructor(port?: number) {
		this.app = express()
		if (port) {
			this._port = port
		}
		this.configureServer()
		this.addApi()
		this.createApplicationDirectiories(["input", "output"])
		setTimeout(
			() => this.listen(),
			this.startUpDelay
		)
	}
	listen = (): void => {
		this.app.listen(this.port, () => {
			this.logger.info(`Listening on port ${this.port}`)
		})
	}
	private readonly addApi = (): void => {
		const {
			internalServerError,
			notFound,
			validationError
		} = EHttpResponseCodes
		this.app.get("/", (req, res, err) => {
			res.send("Request received")
		})
		this.app.use("/docs", serve, async (req: Request, res: Response) => {
			return res.send(
				generateHTML(await import("conversion-service/swagger.json"))
			)
		})
		RegisterRoutes(this.app as Express)
		this.app.get("/swagger.json", (req: Request, res: Response) => res.json(swaggerDocument))
		this.app.use((
			err: unknown,
			req: Request,
			res: Response,
			next: NextFunction
		): Response | void => {
			if (err instanceof ValidateError) {
				console.warn(`Caught Validation Error for ${req.path}:`, err.fields)
				return res.status(validationError).json({
					details: err?.fields,
					message: "Validation Failed"
				})
			}
			if (err instanceof Error) {
				return res.status(internalServerError).json({
					message: "Internal Server Error"
				})
			}
			return next()
		})
		this.app.use((req: Request, res: Response) => {
			res.status(notFound).send({
				message: "Not Found"
			})
		})
	}
	private readonly configureServer = (): void => {
		// Mount json form parser
		this.app.use(cors())
		// Set max limit
		this.app.use(urlencoded({
			extended: true,
			limit: "50mb"
		}))
		this.app.use(json({
			limit: "50mb"
		}))
		this.app.use((req: Request, res: Response, next: NextFunction) => {
			this.logger.info(`Request received: ${req.method} ${req.url}`)
			res.header("Access-Control-Allow-Origin", "*")
			res.header(
				"Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept"
			)
			next()
		})
	}
	private createApplicationDirectiories(directories: string[]): void {
		const basePath = join(__dirname, "../../..")
		const promises = []
		for (const directory of directories) {
			promises.push(createDirectoryIfNotPresent(join(basePath, directory)))
		}
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		Promise.all(promises)
			.then(res => this.logger.info(res))
			.catch(console.error)
	}
	get port(): number {
		return this._port
	}
}