"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.InvalidClientTokenError =
	exports.NetworkError =
	exports.AuthenticationError =
	exports.TaskNotFoundError =
	exports.CloudAPIError =
		void 0
class CloudAPIError extends Error {
	constructor(message, statusCode, responseBody) {
		super(message)
		Object.defineProperty(this, "statusCode", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: statusCode,
		})
		Object.defineProperty(this, "responseBody", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: responseBody,
		})
		this.name = "CloudAPIError"
		Object.setPrototypeOf(this, CloudAPIError.prototype)
	}
}
exports.CloudAPIError = CloudAPIError
class TaskNotFoundError extends CloudAPIError {
	constructor(taskId) {
		super(taskId ? `Task '${taskId}' not found` : "Task not found", 404)
		this.name = "TaskNotFoundError"
		Object.setPrototypeOf(this, TaskNotFoundError.prototype)
	}
}
exports.TaskNotFoundError = TaskNotFoundError
class AuthenticationError extends CloudAPIError {
	constructor(message = "Authentication required") {
		super(message, 401)
		this.name = "AuthenticationError"
		Object.setPrototypeOf(this, AuthenticationError.prototype)
	}
}
exports.AuthenticationError = AuthenticationError
class NetworkError extends CloudAPIError {
	constructor(message = "Network error occurred") {
		super(message)
		this.name = "NetworkError"
		Object.setPrototypeOf(this, NetworkError.prototype)
	}
}
exports.NetworkError = NetworkError
class InvalidClientTokenError extends Error {
	constructor() {
		super("Invalid/Expired client token")
		Object.setPrototypeOf(this, InvalidClientTokenError.prototype)
	}
}
exports.InvalidClientTokenError = InvalidClientTokenError
//# sourceMappingURL=errors.js.map
