import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { LoggingMessageNotificationSchema } from "@modelcontextprotocol/sdk/types.js"
import { INotificationService, LogLevel } from "./interfaces"

export class NotificationService {
	constructor(private notificationService: INotificationService) {}

	connect(name: string, client: Client): void {
		client.setNotificationHandler(LoggingMessageNotificationSchema, async (notification) => {
			const params = notification.params || {}
			const level = params.level || "info"
			const data = params.data || params.message || ""
			const logger = params.logger || ""
			const dataPrefix = logger ? `[${logger}]` : ``
			const message = `MCP ${name}: ${dataPrefix}${data}`

			switch (level) {
				case "critical":
				case "emergency":
				case "error":
					this.notificationService.showErrorMessage(message)
					break
				case "alert":
				case "warning":
					this.notificationService.showWarningMessage(message)
					break
				default:
					this.notificationService.showInformationMessage(message)
			}
		})

		client.fallbackNotificationHandler = async (notification) => {
			this.notificationService.showInformationMessage(`MCP ${name}: ${JSON.stringify(notification)}`)
		}
	}
}