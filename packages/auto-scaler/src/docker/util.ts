import { Stream } from "stream"
export const promisifyStream = async (stream:Stream)
: Promise<void> => new Promise((resolve, reject) => {
	stream.on("data", () => false)
	stream.on("end", resolve)
	stream.on("error", reject)
})