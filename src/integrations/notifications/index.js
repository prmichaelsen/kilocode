"use strict"
var __createBinding =
	(this && this.__createBinding) ||
	(Object.create
		? function (o, m, k, k2) {
				if (k2 === undefined) k2 = k
				var desc = Object.getOwnPropertyDescriptor(m, k)
				if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
					desc = {
						enumerable: true,
						get: function () {
							return m[k]
						},
					}
				}
				Object.defineProperty(o, k2, desc)
			}
		: function (o, m, k, k2) {
				if (k2 === undefined) k2 = k
				o[k2] = m[k]
			})
var __setModuleDefault =
	(this && this.__setModuleDefault) ||
	(Object.create
		? function (o, v) {
				Object.defineProperty(o, "default", { enumerable: true, value: v })
			}
		: function (o, v) {
				o["default"] = v
			})
var __importStar =
	(this && this.__importStar) ||
	(function () {
		var ownKeys = function (o) {
			ownKeys =
				Object.getOwnPropertyNames ||
				function (o) {
					var ar = []
					for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k
					return ar
				}
			return ownKeys(o)
		}
		return function (mod) {
			if (mod && mod.__esModule) return mod
			var result = {}
			if (mod != null)
				for (var k = ownKeys(mod), i = 0; i < k.length; i++)
					if (k[i] !== "default") __createBinding(result, mod, k[i])
			__setModuleDefault(result, mod)
			return result
		}
	})()
Object.defineProperty(exports, "__esModule", { value: true })
exports.showSystemNotification = showSystemNotification
const execa_1 = require("execa")
const os = __importStar(require("os"))
const vscode = __importStar(require("vscode"))
async function showMacOSNotification(options) {
	const { title, subtitle = "", message } = options
	// Try terminal-notifier first if available
	try {
		const args = ["-message", message]
		if (title) {
			args.push("-title", title)
		}
		if (subtitle) {
			args.push("-subtitle", subtitle)
		}
		args.push("-sound", "Tink")
		// Add Kilo Code logo
		const extensionUri = vscode.extensions.getExtension(`kilocode.kilo-code`).extensionUri
		const iconPath = vscode.Uri.joinPath(extensionUri, "assets", "icons", "kilo.png").fsPath
		args.push("-appIcon", iconPath)
		await (0, execa_1.execa)("terminal-notifier", args)
		return
	} catch (error) {
		// If terminal-notifier fails, fall back to osascript
		// This could be because terminal-notifier is not installed or other error
	}
	// Fallback to osascript
	const script = `display notification "${message}" with title "${title}" subtitle "${subtitle}" sound name "Tink"`
	try {
		await (0, execa_1.execa)("osascript", ["-e", script])
	} catch (error) {
		throw new Error(`Failed to show macOS notification: ${error}`)
	}
}
async function showWindowsNotification(options) {
	const { subtitle, message } = options
	const script = `
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

    $template = @"
    <toast>
        <visual>
            <binding template="ToastText02">
                <text id="1">${subtitle}</text>
                <text id="2">${message}</text>
            </binding>
        </visual>
    </toast>
"@

    $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
    $xml.LoadXml($template)
    $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Kilo Code").Show($toast)
    `
	try {
		await (0, execa_1.execa)("powershell", ["-Command", script])
	} catch (error) {
		throw new Error(`Failed to show Windows notification: ${error}`)
	}
}
async function showLinuxNotification(options) {
	const { title = "", subtitle = "", message } = options
	// Combine subtitle and message if subtitle exists
	const fullMessage = subtitle ? `${subtitle}\n${message}` : message
	try {
		await (0, execa_1.execa)("notify-send", [title, fullMessage])
	} catch (error) {
		throw new Error(`Failed to show Linux notification: ${error}`)
	}
}
async function showSystemNotification(options) {
	try {
		const { title = "Kilo Code", message } = options
		if (!message) {
			throw new Error("Message is required")
		}
		const escapedOptions = {
			...options,
			title: title.replace(/"/g, '\\"'),
			message: message.replace(/"/g, '\\"'),
			subtitle: options.subtitle?.replace(/"/g, '\\"') || "",
		}
		switch (os.platform()) {
			case "darwin":
				await showMacOSNotification(escapedOptions)
				break
			case "win32":
				await showWindowsNotification(escapedOptions)
				break
			case "linux":
				await showLinuxNotification(escapedOptions)
				break
			default:
				throw new Error("Unsupported platform")
		}
	} catch (error) {
		console.error("Could not show system notification", error)
	}
}
//# sourceMappingURL=index.js.map
