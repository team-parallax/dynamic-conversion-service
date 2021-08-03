import { Docker } from "node-docker-api"
import { IContainerInfo } from "./interface"
import { IDockerConfiguration } from "../config"
export class DockerService {
	private readonly config: IDockerConfiguration
	private readonly docker: Docker
	constructor(config: IDockerConfiguration) {
		this.config = config
		const {
			socketPath
		} = this.config
		this.docker = new Docker({
			socketPath
		})
	}
	getRunningContainerInfo = async () : Promise<IContainerInfo[]> => {
		const {
			containerLabel
		} = this.config
		const runningContainers = await this.docker.container.list({
			label: containerLabel
		})
		return runningContainers.map(c => ({
			containerId: c.id,
			containerLabel // Redundant
		}))
	}
	createContainer = async () => {
		const {
			imageId, containerLabel
		} = this.config
		await this.docker.container.create({
			Image: imageId,
			Labels: [containerLabel]
		})
	}
	killContainer = async (id: string) => {
		const containers = await this.docker.container.list({
			id
		})
		if (containers.length !== 1) {
			throw new Error("found none or more than 1 containers with the given id")
		}
		const container = containers[0]
		await container.kill()
	}
}