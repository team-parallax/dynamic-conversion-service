import { AutoScaler } from "../src/index"
describe("auto-scaler", () => {
	const autoScaler = new AutoScaler({
		containerStartThreshold: 2,
		dockerConfig: {
			containerLabel: "conversion-service",
			imageId: "42",
			socketPath: "unix:///var/run/docker.sock"
		},
		maxContainers: 42
	})
	it("needs tests", () => {
		console.log(`This test should fail`)
		expect(false).toBe(true)
	})
})