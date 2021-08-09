import "jest"
import { AutoScaler } from "../src/index"
import { IContainerStatus } from "../src/interface"
const dockerTestTimeout = 100000
describe("auto-scaler should pass all tests", () => {
	jest.setTimeout(dockerTestTimeout)
	const autoScaler = new AutoScaler({
		containerStartThreshold: 2,
		dockerConfig: {
			containerLabel: "conversion-service",
			imageId: "bash",
			socketPath: "/var/run/docker.sock"
		},
		maxContainers: 10,
		minContainers: 0
	})
	const pendingRequests = 10
	let containerIds: string[] = []
	// Remove any existing containers
	beforeAll(async () => {
		const initialStatus = await autoScaler.checkContainerStatus(pendingRequests)
		const ids = initialStatus.runningContainers
			.map(runningContainers => runningContainers.containerId)
		await autoScaler.applyConfigurationState({
			containersToRemove: ids.length,
			containersToStart: 0,
			pendingRequests: 0,
			runningContainers: []
		}, ids)
	})
	// Remove any containers missed by the tests
	afterAll(async () => {
		const afterStatus = await autoScaler.checkContainerStatus(pendingRequests)
		const ids = afterStatus.runningContainers
			.map(runningContainers => runningContainers.containerId)
		await autoScaler.applyConfigurationState({
			containersToRemove: ids.length,
			containersToStart: 0,
			pendingRequests: 0,
			runningContainers: []
		}, ids)
	})
	describe("the state computation should work", () => {
		let runningContainers = 10
		let pendingRequests = 0
		const tasksPerContainer = 5
		const maxContainers = 50
		const minContainers = 5
		it("should report 0|0 with 0 pending requests", () => {
			/* Act */
			const result = autoScaler.computeContainerScaleAmount(
				runningContainers,
				pendingRequests,
				tasksPerContainer,
				maxContainers,
				minContainers
			)
			/* Assert */
			expect(result.remove).toEqual(0)
			expect(result.start).toEqual(0)
		})
		it("should start max amount on high request count", () => {
			/* Arrange */
			const testPendingRequests = 10000
			pendingRequests = testPendingRequests
			/* Act */
			const result = autoScaler.computeContainerScaleAmount(
				runningContainers,
				pendingRequests,
				tasksPerContainer,
				maxContainers,
				minContainers
			)
			/* Assert */
			expect(result.remove).toEqual(0)
			expect(result.start).toEqual(maxContainers - runningContainers)
		})
		it("should start 2 containers", () => {
			/* Arrange */
			const testPendingRequests = 10
			pendingRequests = testPendingRequests
			runningContainers = 0
			/* Act */
			const result = autoScaler.computeContainerScaleAmount(
				runningContainers,
				pendingRequests,
				tasksPerContainer,
				maxContainers,
				minContainers
			)
			const expectedStart = 2
			/* Assert */
			expect(result.remove).toEqual(0)
			expect(result.start).toEqual(expectedStart)
		})
		it("should start 3 containers", () => {
			/* Arrange */
			const testPendingRequests = 65
			pendingRequests = testPendingRequests
			const testRunningContainers = 10
			runningContainers = testRunningContainers
			/* Act */
			const result = autoScaler.computeContainerScaleAmount(
				runningContainers,
				pendingRequests,
				tasksPerContainer,
				maxContainers,
				minContainers
			)
			const expectedStart = 3
			/* Assert */
			expect(result.remove).toEqual(0)
			expect(result.start).toEqual(expectedStart)
		})
		it("should remove 5 containers", () => {
			/* Arrange */
			const testPendingRequests = 5
			pendingRequests = testPendingRequests
			const testRunningContainers = 10
			runningContainers = testRunningContainers
			/* Act */
			const result = autoScaler.computeContainerScaleAmount(
				runningContainers,
				pendingRequests,
				tasksPerContainer,
				maxContainers,
				minContainers
			)
			// We only need 1 container but minimum is 5
			const expectedRemove = 5
			/* Assert */
			expect(result.remove).toEqual(expectedRemove)
			expect(result.start).toEqual(0)
		})
	})
	describe("docker service should pass all tests", () => {
		it("should report 0 running containers on start", async () : Promise<void> => {
			/* Act */
			const status = await autoScaler.checkContainerStatus(pendingRequests)
			/* Assert */
			expect(status.runningContainers.length).toEqual(0)
		})
		it("should start 3 containers", async (): Promise<void> => {
			/* Arrange */
			const tempStatus: IContainerStatus = {
				containersToRemove: 0,
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
				containersToRemove: 0,
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
				containersToRemove: 0,
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
		it("should report 3 running containers after starting 3 containers", async () : Promise<void> => {
			/* Arrange */
			const expectedNumberOfContainers = 3
			/* Act */
			const status = await autoScaler.checkContainerStatus(pendingRequests)
			containerIds = status.runningContainers.map(container => container.containerId)
			/* Assert */
			expect(status.runningContainers.length).toEqual(expectedNumberOfContainers)
		})
		it("should remove 3 containers without error", async () => {
			/* Arrange */
			const tempStatus: IContainerStatus = {
				containersToRemove: 3,
				containersToStart: 0,
				pendingRequests,
				runningContainers: []
			}
			const expectedRemovedContainerCount = 3
			/* Act */
			const containers = await autoScaler.applyConfigurationState(tempStatus, containerIds)
			/* Assert */
			expect(containers.length).toEqual(expectedRemovedContainerCount)
		})
		it("should report 0 running containers after removing all", async () : Promise<void> => {
			/* ActAssert */
			const status = await autoScaler.checkContainerStatus(pendingRequests)
			/* Assert */
			expect(status.runningContainers.length).toEqual(0)
		})
		it("should start 10 containers", async (): Promise<void> => {
			/* Arrange */
			containerIds = []
			const tempStatus: IContainerStatus = {
				containersToRemove: 0,
				containersToStart: 10,
				pendingRequests,
				runningContainers: []
			}
			/* Act */
			const targetContainerCount = 10
			const containers = await autoScaler.applyConfigurationState(tempStatus)
			/* Assert */
			expect(containers.length).toEqual(targetContainerCount)
		})
		it("should report 10 running containers after starting 10 containers", async () : Promise<void> => {
			/* Arrange */
			containerIds = []
			const expectedNumberOfContainers = 10
			/* Act */
			const status = await autoScaler.checkContainerStatus(pendingRequests)
			containerIds = status.runningContainers.map(container => container.containerId)
			/* Assert */
			expect(status.runningContainers.length).toEqual(expectedNumberOfContainers)
		})
		it("should remove 5 containers without error", async () => {
			/* Arrange */
			const tempStatus: IContainerStatus = {
				containersToRemove: 5,
				containersToStart: 0,
				pendingRequests,
				runningContainers: []
			}
			const expectedRemovedContainerCount = 5
			/* Act */
			const containers = await autoScaler.applyConfigurationState(tempStatus, containerIds)
			/* Assert */
			expect(containers.length).toEqual(expectedRemovedContainerCount)
		})
		it("should report 5 running containers after removing 5 containers", async () : Promise<void> => {
			/* Arrange */
			containerIds = []
			const expectedNumberOfContainers = 5
			/* Act */
			const status = await autoScaler.checkContainerStatus(pendingRequests)
			containerIds = status.runningContainers.map(container => container.containerId)
			/* Assert */
			expect(status.runningContainers.length).toEqual(expectedNumberOfContainers)
		})
		it("should remove 5 containers without error", async () => {
			/* Arrange */
			const tempStatus: IContainerStatus = {
				containersToRemove: 5,
				containersToStart: 0,
				pendingRequests,
				runningContainers: []
			}
			const expectedRemovedContainerCount = 5
			/* Act */
			const containers = await autoScaler.applyConfigurationState(tempStatus, containerIds)
			/* Assert */
			expect(containers.length).toEqual(expectedRemovedContainerCount)
		})
		it("should report 0 running containers after removing 0 containers", async () : Promise<void> => {
			/* Arrange */
			containerIds = []
			const expectedNumberOfContainers = 0
			/* Act */
			const status = await autoScaler.checkContainerStatus(pendingRequests)
			containerIds = status.runningContainers.map(container => container.containerId)
			/* Assert */
			expect(status.runningContainers.length).toEqual(expectedNumberOfContainers)
		})
	})
})