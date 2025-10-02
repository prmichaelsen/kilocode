import { SimpleWebServer } from "./SimpleWebServer"

// Start the server
const server = new SimpleWebServer()
server.start()

// Graceful shutdown
process.on("SIGTERM", () => {
	console.log("[WebServer] Shutting down gracefully")
	server.stop()
	process.exit(0)
})

process.on("SIGINT", () => {
	console.log("[WebServer] Shutting down gracefully")
	server.stop()
	process.exit(0)
})
