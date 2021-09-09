/* eslint-disable object-curly-newline */
/* eslint-disable @typescript-eslint/naming-convention */
import {
	ContainerNotFoundError,
	InvalidDockerConnectionOptions
} from "./exception"
import { Docker } from "node-docker-api"
import {
	IContainerInfo,
	IDockerApiImage,
	IDockerContainerStatus
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
			socketPath,
			host,
			port
		} = this.config
		const useSocket = socketPath && socketPath !== ""
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
		const targetImageString = `${imageId}:${targetTag}`
		const localImages = await this.docker.image.list({
			filter: imageId
		})
		let isAvailable = false
		localImages.forEach(localImage => {
			const imageData = localImage.data as IDockerApiImage
			const [repoTag] = imageData.RepoTags
			if (repoTag === targetImageString) {
				isAvailable = true
				this.logger.info(`found image '${targetImageString}' locally`)
			}
		})
		if (!isAvailable) {
			const stream = await this.docker.image.create({}, {
				fromImage: imageId,
				tag: targetTag
			}) as Stream
			await promisifyStream(stream)
			this.logger.info(`pulled image: ${targetImageString}`)
		}
	}
	createContainer = async (
		newImageName?: string,
		newTag?: string
	) : Promise<IContainerInfo> => {
		const {
			imageName,
			namePrefix,
			tag,
			envVars = []
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
			Env: envVars,
			Image: `${targetImage}:${targetTag}`,
			name: containerName
		})
		const startedContainer = await newContainer.start()
		// Docker prefixes a '/' before names
		const createdContainerName = `/${containerName}`
		const { data: containerStatusDataRaw } = await startedContainer.status()
		const containerState = containerStatusDataRaw as IDockerContainerStatus
		const { Status } = containerState.State
		let healthStatus = "unhealthy"
		if (containerState.State.Health) {
			healthStatus = containerState.State.Health.Status
		}
		const { IPAddress } = containerState.NetworkSettings
		this.logger.info(`created container: ${createdContainerName}`)
		this.containerCounter++
		return {
			containerHealthStatus: healthStatus,
			containerId: startedContainer.id,
			containerImage: targetImage,
			containerIp: IPAddress,
			containerName: createdContainerName,
			containerStatus: Status,
			containerTag: targetTag ?? "latest"
		}
	}
	getRunningContainerInfo = async () : Promise<IContainerInfo[]> => {
		const runningContainers = await this.docker.container.list({
			"all": 1
		})
		const targetContainers: IContainerInfo[] = []
		for (const container of runningContainers) {
			// eslint-disable-next-line no-await-in-loop
			const { data: containerStatusDataRaw } = await container.status()
			const containerState = containerStatusDataRaw as IDockerContainerStatus
			const { Status } = containerState.State
			let healthStatus = "unhealthy"
			if (containerState.State.Health) {
				healthStatus = containerState.State.Health.Status
			}
			const { IPAddress } = containerState.NetworkSettings
			if (containerState.Name.startsWith(`/${this.config.namePrefix}__`)) {
				const [image, tag] = containerState.Config.Image
				targetContainers.push({
					containerHealthStatus: healthStatus,
					containerId: container.id,
					containerImage: image,
					containerIp: IPAddress,
					containerName: containerState.Name,
					containerStatus: Status,
					containerTag: tag
				})
			}
		}
		return targetContainers
	}
	removeContainer = async (containerId: string) : Promise<IContainerInfo> => {
		const containers = await this.docker.container.list({ "all": 1 })
		const filteredContainers = containers.filter(container => container.id === containerId)
		if (filteredContainers.length !== 1) {
			throw new ContainerNotFoundError(containerId)
		}
		const [container] = filteredContainers
		const containerState = (await container.status()).data as IDockerContainerStatus
		const [image, tag] = containerState.Config.Image.split(":")
		const containerName = containerState.Name
		const stoppedContainer = await container.stop()
		await stoppedContainer.delete({ force: true	})
		const { Status } = containerState.State
		let healthStatus = "unhealthy"
		if (containerState.State.Health) {
			healthStatus = containerState.State.Health.Status
		}
		const { IPAddress } = containerState.NetworkSettings
		this.logger.info(`removed container: ${containerName}`)
		return {
			containerHealthStatus: healthStatus,
			containerId: container.id,
			containerImage: image,
			containerIp: IPAddress,
			containerName,
			containerStatus: Status,
			containerTag: tag
		}
	}
}