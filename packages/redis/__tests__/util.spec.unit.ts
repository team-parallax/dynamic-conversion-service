import {
	getExt,
	getExtFromFilename,
	getExtFromFormat,
	isHealthy,
	isUnhealthy
} from "../src/util"
describe("utility functions should work", () => {
	describe("getExtFromFormat should work", () => {
		it("should extract a valid ext with .", () => {
			const fmt = ".jpg"
			const ext = getExtFromFormat(fmt)
			expect(ext).toEqual(".jpg")
		})
		it("should extract a valid ext without .", () => {
			const fmt = "jpg"
			const ext = getExtFromFormat(fmt)
			expect(ext).toEqual(".jpg")
		})
		it("should return an empty string on undefined", () => {
			const ext = getExtFromFormat(undefined)
			expect(ext).toEqual("")
		})
	})
	describe("getExtFromFilename should work", () => {
		it("should extract an extension from a valid file name", () => {
			const filename = "foo.bar"
			const ext = getExtFromFilename(filename)
			expect(ext).toEqual(".bar")
		})
		it("should return empty string when the file name has no ext", () => {
			const filename = "foobar"
			const ext = getExtFromFilename(filename)
			expect(ext).toEqual("")
		})
		it("should handle uncommon formats", () => {
			expect(getExtFromFilename("foo.bar.baz")).toEqual(".baz")
			expect(getExtFromFilename("foo.bar.baz.boo")).toEqual(".boo")
		})
	})
	describe("getExt should work", () => {
		it("should handle valid cases", () => {
			const fmt = ".jpg"
			const filename = "foo.jpg"
			const ext = getExt(filename, fmt)
			expect(ext).toEqual(".jpg")
		})
		it("should extract without a format", () => {
			const filename = "foo.jpg"
			const ext = getExt(filename, undefined)
			expect(ext).toEqual(".jpg")
		})
		it("should handle only a valid format", () => {
			const filename = "foojpg"
			const fmt = ".jpg"
			const ext = getExt(filename, fmt)
			expect(ext).toEqual(".jpg")
		})
		it("should handle only a valid format", () => {
			const filename = "foojpg"
			const fmt = "jpg"
			const ext = getExt(filename, fmt)
			expect(ext).toEqual(".jpg")
		})
		it("should throw an error when no ext could be determined", () => {
			const filename = "foobar"
			const fmt = undefined
			expect(() => getExt(filename, fmt)).toThrowError()
		})
		it("should handle uncommon formats", () => {
			expect(getExt("foo.bar.baz")).toEqual(".baz")
			expect(getExt("foo.bar.baz", ".baz")).toEqual(".baz")
			expect(getExt("foo", ".boo")).toEqual(".boo")
			expect(getExt("foo", "boo")).toEqual(".boo")
		})
	})
	describe("isHealthy should pass all tests", () => {
		it("should handle valid cases", () => {
			expect(isHealthy("Up 10 seconds (healthy)")).toBe(true)
			expect(isHealthy("Up less than a second (healthy)")).toBe(true)
		})
		it("should handle invalid cases", () => {
			expect(isHealthy("Up 10 seconds (health: starting)")).toBe(false)
			expect(isHealthy("Exited (1) 3 seconds ago")).toBe(false)
		})
	})
	describe("isUnhealthy should pass all tests", () => {
		it("should handle valid cases", () => {
			expect(isUnhealthy("Exited (1) 3 seconds ago")).toBe(true)
			expect(isUnhealthy("Exited (1) 15 seconds ago")).toBe(true)
		})
		it("should handle invalid cases", () => {
			expect(isUnhealthy("Up 10 seconds (health: starting)")).toBe(false)
			expect(isUnhealthy("Up less than a second (health: starting)")).toBe(false)
		})
	})
})
export {}