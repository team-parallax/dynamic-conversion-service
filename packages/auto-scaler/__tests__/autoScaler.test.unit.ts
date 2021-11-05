import "jest"
import { AutoScaler } from "../src/index"
import { ContainerNotFoundError } from "../src/docker/exception"
import { IContainerStatus } from "../src/interface"
import { IDockerConfiguration } from "../src/config"
const dockerTestTimeout = 100000
describe("auto-scaler should pass all tests", () => {
	jest.setTimeout(dockerTestTimeout)
	// Base Config
	const dockerConfig: IDockerConfiguration = {
		imageName: "teamparallax/conversion-service",
		isLocal: true,
		namePrefix: "conversion-service-worker"
	}
	if (process.env.IS_CI) {
		dockerConfig.host = "tcp://localhost"
		dockerConfig.port = 2375
	}
	else {
		dockerConfig.socketPath = "/var/run/docker.sock"
	}
	const autoScaler = new AutoScaler({
		dockerConfig,
		maxContainers: 10,
		minContainers: 0,
		tasksPerContainer: 2
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
		let tasksPerContainer = 5
		const maxContainers = 50
		const minContainers = 5
		it("should report zero|zero with zero pending requests", () => {
			/* Arrange */
			const expectedRemove = 5
			/* Act */
			const result = autoScaler.computeContainerScaleAmount(
				runningContainers,
				pendingRequests,
				tasksPerContainer,
				maxContainers,
				minContainers
			)
			/* Assert */
			expect(result.remove).toEqual(expectedRemove)
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
		it("should start two containers", () => {
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
		it("should start three containers", () => {
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
		it("should remove five containers", () => {
			/* Arrange */
			const testPendingRequests = 5
			pendingRequests = testPendingRequests
			const testRunningContainers = 10
			runningContainers = testRunningContainers
			// We only need 1 container but minimum is 5
			const expectedRemove = 5
			/* Act */
			const result = autoScaler.computeContainerScaleAmount(
				runningContainers,
				pendingRequests,
				tasksPerContainer,
				maxContainers,
				minContainers
			)
			/* Assert */
			expect(result.remove).toEqual(expectedRemove)
			expect(result.start).toEqual(0)
		})
		it("should start containers to reach the minimum when idle", () => {
			/* Arrange */
			const testPendingRequests = 0
			pendingRequests = testPendingRequests
			const testRunningContainers = 1
			runningContainers = testRunningContainers
			const expectedStart = 4
			/* Act */
			const result = autoScaler.computeContainerScaleAmount(
				runningContainers,
				pendingRequests,
				tasksPerContainer,
				maxContainers,
				minContainers
			)
			/* Assert */
			expect(result.start).toEqual(expectedStart)
			expect(result.remove).toEqual(0)
		})
		it("should remove containers to reach the minimum when idle", () => {
			/* Arrange */
			const testPendingRequests = 0
			pendingRequests = testPendingRequests
			const testRunningContainers = 7
			runningContainers = testRunningContainers
			/* Act */
			const result = autoScaler.computeContainerScaleAmount(
				runningContainers,
				pendingRequests,
				tasksPerContainer,
				maxContainers,
				minContainers
			)
			const expectedRemove = 2
			/* Assert */
			expect(result.start).toEqual(0)
			expect(result.remove).toEqual(expectedRemove)
		})
		it("should start only max amount with higher than max amount of requests", () => {
			/* Arrange */
			const testPendingRequests = 100
			pendingRequests = testPendingRequests
			const testRunningContainers = 0
			runningContainers = testRunningContainers
			const testTasksPerContainer = 1
			tasksPerContainer = testTasksPerContainer
			/* Act */
			const result = autoScaler.computeContainerScaleAmount(
				runningContainers,
				pendingRequests,
				tasksPerContainer,
				maxContainers,
				minContainers
			)
			/* Assert */
			expect(result.start).toEqual(maxContainers)
			expect(result.remove).toEqual(0)
		})
		it("should remove containers to reach minimum when idle", () => {
			/* Arrange */
			const testPendingRequests = 0
			pendingRequests = testPendingRequests
			const testRunningContainers = 7
			runningContainers = testRunningContainers
			const testTasksPerContainer = 1
			tasksPerContainer = testTasksPerContainer
			/* Act */
			const result = autoScaler.computeContainerScaleAmount(
				runningContainers,
				pendingRequests,
				tasksPerContainer,
				maxContainers,
				minContainers
			)
			/* Assert */
			expect(result.start).toEqual(0)
			expect(result.remove).toEqual(runningContainers - minContainers)
		})
	})
	describe("docker service should pass all tests", () => {
		it("should report zero running containers on start", async () : Promise<void> => {
			/* Act */
			const status = await autoScaler.checkContainerStatus(pendingRequests)
			/* Assert */
			expect(status.runningContainers.length).toEqual(0)
		})
		it("should start three containers", async (): Promise<void> => {
			/* Arrange */
			const tempStatus: IContainerStatus = {
				containersToRemove: 0,
				containersToStart: 3,
				pendingRequests,
				runningContainers: []
			}
			/* Act */
			const targetContainerCount = 3
			const {
				removedContainers,
				startedContainers
			} = await autoScaler.applyConfigurationState(tempStatus)
			/* Assert */
			expect(startedContainers.length).toEqual(targetContainerCount)
			expect(removedContainers.length).toEqual(0)
		})
		it("should start zero containers", async (): Promise<void> => {
			/* Arrange */
			const tempStatus: IContainerStatus = {
				containersToRemove: 0,
				containersToStart: 0,
				pendingRequests,
				runningContainers: []
			}
			const targetContainerCount = 0
			/* Act */
			const {
				removedContainers,
				startedContainers
			} = await autoScaler.applyConfigurationState(tempStatus)
			/* Assert */
			expect(startedContainers.length).toEqual(targetContainerCount)
			expect(removedContainers.length).toEqual(0)
		})
		it("should start zero containers on negative target", async (): Promise<void> => {
			/* Arrange */
			const tempStatus: IContainerStatus = {
				containersToRemove: 0,
				containersToStart: -1,
				pendingRequests,
				runningContainers: []
			}
			const targetContainerCount = 0
			/* Act */
			const {
				removedContainers,
				startedContainers
			} = await autoScaler.applyConfigurationState(tempStatus)
			/* Assert */
			expect(startedContainers.length).toEqual(targetContainerCount)
			expect(removedContainers.length).toEqual(targetContainerCount)
		})
		it(
			"should report three running containers after starting three containers",
			async () : Promise<void> => {
			/* Arrange */
				const expectedNumberOfContainers = 3
				/* Act */
				const status = await autoScaler.checkContainerStatus(pendingRequests)
				containerIds = status.runningContainers.map(container => container.containerId)
				/* Assert */
				expect(status.runningContainers.length).toEqual(expectedNumberOfContainers)
			}
		)
		it("should remove three containers without error", async () => {
			/* Arrange */
			const tempStatus: IContainerStatus = {
				containersToRemove: 3,
				containersToStart: 0,
				pendingRequests,
				runningContainers: []
			}
			const expectedRemovedContainerCount = 3
			/* Act */
			const {
				removedContainers,
				startedContainers
			} = await autoScaler.applyConfigurationState(tempStatus, containerIds)
			/* Assert */
			expect(removedContainers.length).toEqual(expectedRemovedContainerCount)
			expect(startedContainers.length).toEqual(0)
		})
		it("should report zero running containers after removing all", async () : Promise<void> => {
			/* ActAssert */
			const status = await autoScaler.checkContainerStatus(pendingRequests)
			/* Assert */
			expect(status.runningContainers.length).toEqual(0)
		})
		it("should start two containers", async (): Promise<void> => {
			/* Arrange */
			containerIds = []
			const tempStatus: IContainerStatus = {
				containersToRemove: 0,
				containersToStart: 2,
				pendingRequests,
				runningContainers: []
			}
			/* Act */
			const targetContainerCount = 2
			const {
				removedContainers,
				startedContainers
			} = await autoScaler.applyConfigurationState(tempStatus)
			/* Assert */
			expect(startedContainers.length).toEqual(targetContainerCount)
			expect(removedContainers.length).toEqual(0)
		})
		it(
			"should report two running containers after starting two containers",
			async () : Promise<void> => {
			/* Arrange */
				containerIds = []
				const expectedNumberOfContainers = 2
				/* Act */
				const status = await autoScaler.checkContainerStatus(pendingRequests)
				containerIds = status.runningContainers.map(container => container.containerId)
				/* Assert */
				expect(status.runningContainers.length).toEqual(expectedNumberOfContainers)
			}
		)
		it("should remove one containers without error", async () => {
			/* Arrange */
			const tempStatus: IContainerStatus = {
				containersToRemove: 1,
				containersToStart: 0,
				pendingRequests,
				runningContainers: []
			}
			const expectedRemovedContainerCount = 1
			/* Act */
			const {
				removedContainers,
				startedContainers
			} = await autoScaler.applyConfigurationState(tempStatus, containerIds)
			/* Assert */
			expect(removedContainers.length).toEqual(expectedRemovedContainerCount)
			expect(startedContainers.length).toEqual(0)
		})
		it("should report one running containers after removing two containers", async () : Promise<void> => {
			/* Arrange */
			containerIds = []
			const expectedNumberOfContainers = 1
			/* Act */
			const status = await autoScaler.checkContainerStatus(pendingRequests)
			containerIds = status.runningContainers.map(container => container.containerId)
			/* Assert */
			expect(status.runningContainers.length).toEqual(expectedNumberOfContainers)
		})
		it("should remove one containers without error", async () => {
			/* Arrange */
			const tempStatus: IContainerStatus = {
				containersToRemove: 1,
				containersToStart: 0,
				pendingRequests,
				runningContainers: []
			}
			const expectedRemovedContainerCount = 1
			/* Act */
			const {
				removedContainers,
				startedContainers
			} = await autoScaler.applyConfigurationState(tempStatus, containerIds)
			/* Assert */
			expect(removedContainers.length).toEqual(expectedRemovedContainerCount)
			expect(startedContainers.length).toEqual(0)
		})
		it("should report zero running containers after removing one containers", async () : Promise<void> => {
			/* Arrange */
			containerIds = []
			const expectedNumberOfContainers = 0
			/* Act */
			const status = await autoScaler.checkContainerStatus(pendingRequests)
			containerIds = status.runningContainers.map(container => container.containerId)
			/* Assert */
			expect(status.runningContainers.length).toEqual(expectedNumberOfContainers)
		})
		it("should start one container with a different image and tag", async () : Promise<void> => {
			/* Arrange */
			const tempStatus: IContainerStatus = {
				containersToRemove: 0,
				containersToStart: 1,
				pendingRequests,
				runningContainers: []
			}
			/* Act */
			const {
				startedContainers,
				removedContainers
			} = await autoScaler.applyConfigurationState(
				tempStatus,
				containerIds,
				"redis",
				"6.2.5-alpine"
			)
			expect(startedContainers.length).toEqual(1)
			expect(removedContainers.length).toEqual(0)
			const [container] = startedContainers
			/* Assert */
			expect(container.containerImage).toEqual("redis")
			expect(container.containerTag).toEqual("6.2.5-alpine")
		})
		it("should report one running container after creating one container", async () : Promise<void> => {
			/* Arrange */
			containerIds = []
			const expectedNumberOfContainers = 1
			/* Act */
			const status = await autoScaler.checkContainerStatus(pendingRequests)
			containerIds = status.runningContainers.map(container => container.containerId)
			/* Assert */
			expect(status.runningContainers.length).toEqual(expectedNumberOfContainers)
		})
		it("should remove one container with a different image and tag", async () : Promise<void> => {
			/* Arrange */
			const tempStatus: IContainerStatus = {
				containersToRemove: 1,
				containersToStart: 0,
				pendingRequests,
				runningContainers: []
			}
			/* Act */
			const {
				removedContainers,
				startedContainers
			} = await autoScaler.applyConfigurationState(
				tempStatus,
				containerIds
			)
			expect(removedContainers.length).toEqual(1)
			expect(startedContainers.length).toEqual(0)
			const [removedContainer] = removedContainers
			/* Assert */
			expect(removedContainer.containerImage).toEqual("redis")
			expect(removedContainer.containerTag).toEqual("6.2.5-alpine")
		})
		it("should start two containers", async (): Promise<void> => {
			/* Arrange */
			containerIds = []
			const tempStatus: IContainerStatus = {
				containersToRemove: 0,
				containersToStart: 2,
				pendingRequests,
				runningContainers: []
			}
			/* Act */
			const targetContainerCount = 2
			const {
				removedContainers,
				startedContainers
			} = await autoScaler.applyConfigurationState(tempStatus)
			/* Assert */
			expect(startedContainers.length).toEqual(targetContainerCount)
			expect(removedContainers.length).toEqual(0)
		})
		it(
			"should report two running containers after starting two containers",
			async () : Promise<void> => {
			/* Arrange */
				containerIds = []
				const expectedNumberOfContainers = 2
				/* Act */
				const status = await autoScaler.checkContainerStatus(pendingRequests)
				containerIds = status.runningContainers.map(container => container.containerId)
				/* Assert */
				expect(status.runningContainers.length).toEqual(expectedNumberOfContainers)
			}
		)
		it("should remove two containers by id", async (): Promise<void> => {
			const removePromises = containerIds.map(async id => autoScaler.removeContainer(id))
			const removedContainers = await Promise.all(removePromises)
			const stoppedContainerIds = removedContainers.map(container => container.containerId)
			// eslint-disable-next-line @typescript-eslint/require-array-sort-compare
			expect(containerIds.sort()).toEqual(stoppedContainerIds.sort())
		})
		it(
			"should report zero running containers after removing two containers by id",
			async () : Promise<void> => {
				/* Arrange */
				containerIds = []
				const expectedNumberOfContainers = 0
				/* Act */
				const status = await autoScaler.checkContainerStatus(pendingRequests)
				containerIds = status.runningContainers.map(container => container.containerId)
				/* Assert */
				expect(status.runningContainers.length).toEqual(expectedNumberOfContainers)
			}
		)
		it("should throw an error when trying to remove a invalid container id", async () => {
			await expect(autoScaler.removeContainer("foobarbaz"))
				.rejects.toThrowError(ContainerNotFoundError)
		})
	})
})