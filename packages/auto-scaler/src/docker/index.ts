import {
	ContainerNotFoundError,
	InvalidDockerConnectionOptions
} from "./execption"
import { Docker } from "node-docker-api"
import {
	IContainerInfo,
	IDockerAPIContainer,
	IDockerAPIImage
} from "./interface"
import { IDockerConfiguration } from "../config"
import { Logger } from "logger/src"
import { Stream } from "stream"
import { promisifyStream } from "./util"
export class DockerService {
	private readonly config: IDockerConfiguration
	private containerCounter: number = 1
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
		const targetString = `${imageId}:${targetTag}`
		const localImages = await this.docker.image.list()
		let isAvailable = false
		localImages.forEach(localImage => {
			const imageData = localImage.data as IDockerAPIImage
			const [repoTag] = imageData.RepoTags
			if (repoTag === targetString) {
				isAvailable = true
				this.logger.info(`found image '${targetString}' locally`)
			}
		})
		if (!isAvailable) {
			const stream = await this.docker.image.create({}, {
				fromImage: imageId,
				tag: targetTag
			}) as Stream
			await promisifyStream(stream)
			this.logger.info(`pulled image: ${imageId}:${targetTag}`)
		}
	}
	createContainer = async (
		newImageName?: string,
		newTag?: string
	) : Promise<IContainerInfo> => {
		const {
			imageName, namePrefix, tag, envVars = []
		} = this.config
		const needPull = !this.hasImage || newImageName !== undefined || newTag !== undefined
		const targetImage = newImageName ?? imageName
		const targetTag = newTag ?? tag ?? "latest"
		if (needPull) {
			await this.checkImage(targetImage, targetTag)
			this.hasImage = true
		}
		const containerName = `${namePrefix}__${this.containerCounter}`
		const newContainer = await this.docker.container.create({
			// eslint-disable-next-line @typescript-eslint/naming-convention
			Env: envVars,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			Image: `${targetImage}:${targetTag}`,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			name: containerName
		})
		const startedContainer = await newContainer.start()
		this.logger.info(`created container: ${containerName}`)
		this.containerCounter++
		return {
			containerId: startedContainer.id,
			containerImage: targetImage,
			containerName,
			containerTag: targetTag ?? "latest"
		}
	}
	getRunningContainerInfo = async () : Promise<IContainerInfo[]> => {
		const runningContainers = await this.docker.container.list()
		return runningContainers.map(container => {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const typedData = container.data as IDockerAPIContainer
			const [image, tag] = typedData.Image.split(":")
			return {
				containerId: container.id,
				containerImage: image,
				containerName: typedData.Names[0],
				containerTag: tag
			}
		}).filter(container =>
			container.containerName.startsWith(`/${this.config.namePrefix}__`))
	}
	removeContainer = async (containerId: string) : Promise<IContainerInfo> => {
		const containers = await this.docker.container.list()
		const filteredContainers = containers.filter(container => container.id === containerId)
		if (filteredContainers.length !== 1) {
			throw new ContainerNotFoundError(containerId)
		}
		const [container] = filteredContainers
		const typedData = container.data as IDockerAPIContainer
		const [image, tag] = typedData.Image.split(":")
		const [name] = typedData.Names
		const stoppedContainer = await container.stop()
		await stoppedContainer.delete({
			force: true
		})
		this.logger.info(`removed container: ${name}`)
		return {
			containerId: container.id,
			containerImage: image,
			containerName: name,
			containerTag: tag
		}
	}
}