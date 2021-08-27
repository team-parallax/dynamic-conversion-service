import {
	getExt, getExtFromFilename, getExtFromFormat
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
	})
})
export {}