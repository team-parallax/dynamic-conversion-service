import { getType } from "mime"
export const isMediaFile = (fileExtension: string): boolean => {
	const isAudio = getType(fileExtension)?.startsWith("audio/") ?? false
	const isVideo = getType(fileExtension)?.startsWith("video/") ?? false
	const isImage = getType(fileExtension)?.startsWith("image/") ?? false
	return isAudio || isVideo || isImage
}