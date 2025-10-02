const WebSocket = require("ws")

const ws = new WebSocket("ws://localhost:3001/ws")

ws.on("open", function open() {
	console.log("Connected to WebSocket server")

	// Send a test message
	const testMessage = {
		type: "new_task",
		payload: {
			text: "List the files in the current project",
		},
		timestamp: Date.now(),
	}

	console.log("Sending test message:", testMessage)
	ws.send(JSON.stringify(testMessage))
})

ws.on("message", function message(data) {
	try {
		const parsed = JSON.parse(data.toString())
		console.log("Received message:", parsed)
	} catch (error) {
		console.log("Raw message:", data.toString())
	}
})

ws.on("close", function close() {
	console.log("Disconnected from WebSocket server")
})

ws.on("error", function error(err) {
	console.error("WebSocket error:", err)
})

// Keep the connection alive for testing
setTimeout(() => {
	console.log("Closing connection...")
	ws.close()
}, 10000)
