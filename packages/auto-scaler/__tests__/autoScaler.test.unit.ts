import { AutoScaler } from "../src/index"
import { IContainerStatus } from "../src/interface"
describe("auto-scaler should pass all tests", () => {
	const autoScaler = new AutoScaler({
		containerStartThreshold: 2,
		dockerConfig: {
			containerLabel: "conversion-service",
			imageId: "bash",
			socketPath: "/var/run/docker.sock"
		},
		maxContainers: 5
	})
	const pendingRequests = 10
	it("should report 0 running containers on start", async () : Promise<void> => {
		/* ActAssert */
		const status = await autoScaler.checkContainerStatus(pendingRequests)
		/* Assert */
		expect(status.runningContainers.length).toEqual(0)
	})
	describe("auto-scaler should start the correct amount of containers", () => {
		it("should start 3 containers", async (): Promise<void> => {
			/* Arrange */
			const tempStatus: IContainerStatus = {
				containersToKill: 0,
				containersToStart: 3,
				pendingRequests,
				runningContainers: []
			}
			/* Act */
			const targetContainerCount = 3
			const containers = await autoScaler.applyConfigurationState(tempStatus)
			/* Assert */
			expect(containers.length).toEqual(targetContainerCount)
		})
		it("should start 0 containers", async (): Promise<void> => {
			/* Arrange */
			const tempStatus: IContainerStatus = {
				containersToKill: 0,
				containersToStart: 0,
				pendingRequests,
				runningContainers: []
			}
			const targetContainerCount = 0
			/* Act */
			const containers = await autoScaler.applyConfigurationState(tempStatus)
			/* Assert */
			expect(containers.length).toEqual(targetContainerCount)
		})
		it("should start 0 containers on negative target", async (): Promise<void> => {
			/* Arrange */
			const tempStatus: IContainerStatus = {
				containersToKill: 0,
				containersToStart: -1,
				pendingRequests,
				runningContainers: []
			}
			const targetContainerCount = 0
			/* Act */
			const containers = await autoScaler.applyConfigurationState(tempStatus)
			/* Assert */
			expect(containers.length).toEqual(targetContainerCount)
		})
	})
})