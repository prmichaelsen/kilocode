import dotenv from "dotenv"
import { SimpleWebServer } from "./SimpleWebServer"

// Load environment variables from .env file
dotenv.config()

// Start the server
const server = new SimpleWebServer()
server.start()

// Graceful shutdown
process.on("SIGTERM", async () => {
	console.log("[WebServer] Shutting down gracefully")
	await server.stop()
	process.exit(0)
})

process.on("SIGINT", async () => {
	console.log("[WebServer] Shutting down gracefully")
	await server.stop()
	process.exit(0)
})
