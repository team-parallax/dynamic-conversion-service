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
	createContainer = async () : Promise<IContainerInfo> => {
		const {
			imageId, containerLabel
		} = this.config
		const con = await this.docker.container.create({
			// eslint-disable-next-line @typescript-eslint/naming-convention
			Image: imageId,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			label: [containerLabel]
		})
		const startedContainer = await con.start()
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
	killContainer = async (containerId: string) : Promise<void> => {
		const containers = await this.docker.container.list({
			id: containerId
		})
		if (containers.length !== 1) {
			throw new Error("found none or more than 1 containers with the given id")
		}
		const [container] = containers
		await container.kill()
	}
}