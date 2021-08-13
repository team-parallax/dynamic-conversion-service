import { Docker } from "node-docker-api"
import { IContainerInfo } from "./interface"
import { IDockerConfiguration } from "../config"
import { InvalidDockerConnectionOptions } from "./execption"
import { Logger } from "../../../logger/src"
import { Stream } from "stream"
import { promisifyStream } from "./util"
export class DockerService {
	private readonly config: IDockerConfiguration
	private readonly docker: Docker
	private hasImage: boolean = false
	private readonly logger: Logger
	constructor(config: IDockerConfiguration, logger: Logger) {
		this.config = config
		const {
			socketPath, host, port
		} = this.config
		const useSocket = socketPath && (!host && !port)
		const useHostPort = host && port && !socketPath
		if (useSocket) {
			this.docker = new Docker({
				socketPath
			})
		}
		else if (useHostPort) {
			this.docker = new Docker({
				host,
				port
			})
		}
		else {
			throw new InvalidDockerConnectionOptions()
		}
		this.logger = logger
		this.logger.info(`created DockerService using ${socketPath}`)
	}
	checkImage = async (imageId: string, tag?: string): Promise<void> => {
		const targetTag = tag ?? "latest"
		const stream = await this.docker.image.create({}, {
			fromImage: imageId,
			tag: targetTag
		}) as Stream
		await promisifyStream(stream)
		this.logger.info(`pulled image: ${imageId}`)
	}
	createContainer = async () : Promise<IContainerInfo> => {
		const {
			imageId, containerLabel, tag
		} = this.config
		if (!this.hasImage) {
			await this.checkImage(imageId, tag)
			this.hasImage = true
		}
		const newContainer = await this.docker.container.create({
			// eslint-disable-next-line @typescript-eslint/naming-convention
			Cmd: ["sleep", "infinity"],
			// eslint-disable-next-line @typescript-eslint/naming-convention
			Image: imageId,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			label: [containerLabel]
		})
		const startedContainer = await newContainer.start()
		this.logger.info(`created container: ${startedContainer.id}/${containerLabel}`)
		return {
			containerId: startedContainer.id,
			containerLabel
		}
	}
	getRunningContainerInfo = async () : Promise<IContainerInfo[]> => {
		const {
			containerLabel
		} = this.config
		const runningContainers = await this.docker.container.list({
			label: containerLabel
		})
		return runningContainers.map(container => ({
			containerId: container.id,
			containerLabel
		}))
	}
	removeContainer = async (containerId: string) : Promise<IContainerInfo> => {
		const containers = await this.docker.container.list({
			// eslint-disable-next-line @typescript-eslint/naming-convention
			label: this.config.containerLabel
			// Filtering by container id does not work as expected
		})
		if (containers.length < 1) {
			throw new Error("cannot remove container when no container is running")
		}
		const [container] = containers.filter(container => container.id === containerId)
		const stoppedContainer = await container.stop()
		await stoppedContainer.delete({
			force: true
		})
		this.logger.info(`removed container: ${container.id}/${this.config.containerLabel}`)
		return {
			containerId: container.id,
			containerLabel: this.config.containerLabel
		}
	}
}