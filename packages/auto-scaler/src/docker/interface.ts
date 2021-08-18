export interface IContainerInfo {
	containerId: string,
	containerImage?: string,
	containerName: string,
	containerTag?: string,
	currentConversionInfo: null | {
		// Importing from redis would make it not-standalone anymore
		file: string,
		filename: string,
		originalFormat?: string,
		targetFormat: string
	}
}
export interface IDockerAPIContainer {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Image: string,
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Names: string[]
}