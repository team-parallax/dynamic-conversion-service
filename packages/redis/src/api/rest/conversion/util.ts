import { EConversionStatus } from "../../conversion-client"
import { EConversionStatus as LegacyStatus } from "conversion-service/src/service/conversion/enum"
export const isFinished = (status?: EConversionStatus): boolean => {
	if (!status) {
		return false
	}
	return status === EConversionStatus.Converted || status === EConversionStatus.Erroneous
}
export const assertStatus = (status: EConversionStatus): LegacyStatus => {
	switch (status) {
		case EConversionStatus.Converted:
			return LegacyStatus.converted
		case EConversionStatus.Erroneous:
			return LegacyStatus.erroneous
		case EConversionStatus.InQueue:
			return LegacyStatus.inQueue
		case EConversionStatus.Processing:
			return LegacyStatus.processing
		default:
			return LegacyStatus.erroneous
	}
}