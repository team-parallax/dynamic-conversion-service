/* eslint-disable no-console */
export class Logger {
	private readonly indentationDepth: number = 2
	error = (content: any): void => {
		console.error(this.trimQuotes(JSON.stringify(content, null, this.indentationDepth)))
	}
	log = (content: any): void => {
		console.log(this.trimQuotes(JSON.stringify(content, null, this.indentationDepth)))
	}
	private readonly trimQuotes = (message: string): string => {
		return message.slice(1, message.length - 1)
	}
}