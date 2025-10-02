"use strict"
// kilocode_change - new file
// npx vitest core/webview/__tests__/ClineProvider.kilocode-organization.spec.ts
Object.defineProperty(exports, "__esModule", { value: true })
const common_mocks_1 = require("../../../__tests__/common-mocks")
// Setup all mocks before any imports
;(0, common_mocks_1.setupCommonMocks)()
describe("ClineProvider", () => {
	let provider
	let mockWebviewView
	beforeEach(() => {
		vi.clearAllMocks()
		const setup = (0, common_mocks_1.setupProvider)()
		provider = setup.provider
		mockWebviewView = (0, common_mocks_1.createMockWebviewView)()
	})
	describe("kilocodeOrganizationId", () => {
		test("preserves kilocodeOrganizationId when no previous token exists", async () => {
			await provider.resolveWebviewView(mockWebviewView)
			const messageHandler = mockWebviewView.webview.onDidReceiveMessage.mock.calls[0][0]
			const mockUpsertProviderProfile = vi.fn()
			provider.upsertProviderProfile = mockUpsertProviderProfile
			provider.providerSettingsManager = {
				getProfile: vi.fn().mockResolvedValue({
					// Simulate saved config with NO kilocodeToken (common case)
					name: "test-config",
					apiProvider: "anthropic",
					apiKey: "test-key",
					id: "test-id",
				}),
			}
			await messageHandler({
				type: "upsertApiConfiguration",
				text: "test-config",
				apiConfiguration: {
					apiProvider: "anthropic",
					apiKey: "test-key",
					kilocodeToken: "test-kilo-token",
					kilocodeOrganizationId: "org-123",
				},
			})
			expect(mockUpsertProviderProfile).toHaveBeenCalledWith(
				"test-config",
				expect.objectContaining({
					kilocodeToken: "test-kilo-token",
					kilocodeOrganizationId: "org-123", // Should be preserved
				}),
			)
		})
		test("clears kilocodeOrganizationId when token actually changes", async () => {
			await provider.resolveWebviewView(mockWebviewView)
			const messageHandler = mockWebviewView.webview.onDidReceiveMessage.mock.calls[0][0]
			const mockUpsertProviderProfile = vi.fn()
			provider.upsertProviderProfile = mockUpsertProviderProfile
			provider.providerSettingsManager = {
				getProfile: vi.fn().mockResolvedValue({
					// Simulate saved config with DIFFERENT kilocodeToken
					name: "test-config",
					apiProvider: "anthropic",
					apiKey: "test-key",
					kilocodeToken: "old-kilo-token",
					id: "test-id",
				}),
			}
			await messageHandler({
				type: "upsertApiConfiguration",
				text: "test-config",
				apiConfiguration: {
					apiProvider: "anthropic",
					apiKey: "test-key",
					kilocodeToken: "new-kilo-token", // Different token
					kilocodeOrganizationId: "org-123",
				},
			})
			// Verify the organization ID was cleared for security
			expect(mockUpsertProviderProfile).toHaveBeenCalledWith(
				"test-config",
				expect.objectContaining({
					kilocodeToken: "new-kilo-token",
					kilocodeOrganizationId: undefined, // Should be cleared
				}),
			)
		})
	})
})
//# sourceMappingURL=ClineProvider.kilocode-organization.spec.js.map
