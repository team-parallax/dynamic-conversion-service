import {
	InvalidPathError,
	basePath
} from "../../constants"
import {
	ReadStream,
	createReadStream,
	existsSync,
	mkdir,
	readFileSync,
	readdirSync,
	rmdirSync,
	statSync,
	unlink,
	unlinkSync,
	writeFile
} from "fs"
import { resolve } from "path"
type TArrayBufferView = NodeJS.ArrayBufferView
export const deleteFile = async (path?: string): Promise<void> => {
	return await new Promise((resolve, reject) => {
		if (!path) {
			reject(new InvalidPathError("No path was provided"))
		}
		else if (!existsSync(path)) {
			reject(new InvalidPathError("No path was provided"))
		}
		else {
			unlink(path, err => {
				reject(err)
			})
			resolve()
		}
	})
}
export const getReadableObjectFromFile = (path: string): ReadStream => {
	return createReadStream(path)
}
export const readFileToBuffer = async (path: string): Promise<Buffer> => {
	const stream = createReadStream(path)
	const data: Buffer[] = []
	return await new Promise((resolve, reject) => {
		stream.on("data", (chunk: string | Buffer) => {
			if (typeof chunk === "string") {
				data.push(Buffer.from(chunk))
			}
			else {
				data.push(chunk)
			}
		})
		stream.on("error", (error: Error) => {
			reject(error)
		})
		stream.on("end", () => {
			resolve(Buffer.concat(data))
		})
	})
}
export const writeToFile = async (
	outputPath: string,
	data: TArrayBufferView
): Promise<string> => {
	return new Promise((resolve, reject) => {
		writeFile(outputPath, data, err => {
			reject(err)
		})
		resolve(`Created File in ${outputPath}.`)
	})
}
export const createDirectoryIfNotPresent = async (
	newDirectory: string
): Promise<string> => {
	return new Promise((resolve, reject) => {
		if (newDirectory === "") {
			reject()
		}
		if (!existsSync(newDirectory)) {
			mkdir(
				newDirectory,
				{
					// eslint-disable-next-line @typescript-eslint/naming-convention
					recursive: true
				},
				err => {
					reject(err)
				}
			)
			resolve("Created")
		}
		else {
			resolve(`Dir '${newDirectory}' already exists.`)
		}
		reject()
	})
}
export const deleteFolderRecursive = (path: string): void => {
	if (isDirectory(path)) {
		readdirSync(path).forEach((file: string, index: number) => {
			const currentPath = `${path}/${file}`
			if (isDirectory(currentPath)) {
				deleteFolderRecursive(currentPath)
			}
			else {
				unlinkSync(currentPath)
			}
		})
		rmdirSync(path, {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			recursive: true
		})
	}
	else {
		throw new InvalidPathError(`Given Path does not point to a directory: ${path}`)
	}
}
export const isDirectory = (path: string): boolean => {
	if (existsSync(path) && statSync(path).isDirectory()) {
		return true
	}
	return false
}
export const isFile = (path: string): boolean => {
	if (existsSync(path) && statSync(path).isFile()) {
		return true
	}
	return false
}
export const readFromFileSync = (pathParam: string): Buffer => {
	// Will evaluate to something like ffmpeg-webservice/<pathParam>
	const path = resolvePath(pathParam)
	if (!isFile(path)) {
		throw new InvalidPathError("No such file")
	}
	const file = readFileSync(path)
	return Buffer.from(file)
}
export const resolvePath = (pathParam: string): string => {
	return resolve(basePath, pathParam)
}