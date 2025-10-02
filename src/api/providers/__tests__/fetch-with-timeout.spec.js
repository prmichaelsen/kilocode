"use strict"
// npx vitest run api/providers/__tests__/fetch-with-timeout.spec.ts
Object.defineProperty(exports, "__esModule", { value: true })
const vitest_1 = require("vitest")
// Declare hoisted mocks to be safely referenced inside vi.mock factory
const hoisted = vitest_1.vi.hoisted(() => {
	return {
		mockFetch: vitest_1.vi.fn(),
		mockAgentConstructor: vitest_1.vi.fn(),
		agentInstances: [],
	}
})
// Mock the undici module used by the implementation
vitest_1.vi.mock("undici", () => {
	return {
		Agent: vitest_1.vi.fn().mockImplementation((opts) => {
			hoisted.mockAgentConstructor(opts)
			const instance = { __mock: "Agent" }
			hoisted.agentInstances.push(instance)
			return instance
		}),
		fetch: hoisted.mockFetch,
	}
})
// Import after mocking so the implementation picks up our mocks
const fetchWithTimeout_1 = require("../kilocode/fetchWithTimeout")
;(0, vitest_1.describe)("fetchWithTimeout - header precedence and timeout wiring", () => {
	;(0, vitest_1.beforeEach)(() => {
		vitest_1.vi.clearAllMocks()
		hoisted.agentInstances.length = 0
	})
	;(0, vitest_1.it)(
		"should prefer persistent headers over request-specific headers (application/json overrides text/plain)",
		async () => {
			hoisted.mockFetch.mockResolvedValueOnce({ ok: true })
			const timeoutMs = 5000
			const f = (0, fetchWithTimeout_1.fetchWithTimeout)(timeoutMs, {
				"Content-Type": "application/json",
				"X-Test": "A",
			})
			await f("http://example.com", {
				method: "POST",
				headers: {
					"Content-Type": "text/plain",
					"X-Test": "B",
				},
				body: '{"x":1}',
			})
			// Agent constructed with correct timeouts
			;(0, vitest_1.expect)(hoisted.mockAgentConstructor).toHaveBeenCalledWith({
				headersTimeout: timeoutMs,
				bodyTimeout: timeoutMs,
			})
			// Fetch called with merged headers where persistent wins
			;(0, vitest_1.expect)(hoisted.mockFetch).toHaveBeenCalledTimes(1)
			const [url, init] = hoisted.mockFetch.mock.calls[0]
			;(0, vitest_1.expect)(url).toBe("http://example.com")
			// Dispatcher is the agent instance we created
			;(0, vitest_1.expect)(init.dispatcher).toBe(hoisted.agentInstances[0])
			// Persistent headers must override request-specific ones
			;(0, vitest_1.expect)(init.headers).toEqual(
				vitest_1.expect.objectContaining({
					"Content-Type": "application/json",
					"X-Test": "A",
				}),
			)
		},
	)
	;(0, vitest_1.it)(
		"should apply persistent application/json when request-specific Content-Type is omitted (prevents defaulting to text/plain)",
		async () => {
			hoisted.mockFetch.mockResolvedValueOnce({ ok: true })
			const f = (0, fetchWithTimeout_1.fetchWithTimeout)(10000, {
				"Content-Type": "application/json",
			})
			await f("http://example.com", {
				method: "POST",
				body: '{"x":1}',
			})
			;(0, vitest_1.expect)(hoisted.mockFetch).toHaveBeenCalledTimes(1)
			const [, init] = hoisted.mockFetch.mock.calls[0]
			// Ensure Content-Type remains application/json
			;(0, vitest_1.expect)(init.headers).toEqual(
				vitest_1.expect.objectContaining({
					"Content-Type": "application/json",
				}),
			)
		},
	)
})
//# sourceMappingURL=fetch-with-timeout.spec.js.map
