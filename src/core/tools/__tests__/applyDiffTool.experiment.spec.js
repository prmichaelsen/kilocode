"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const multiApplyDiffTool_1 = require("../multiApplyDiffTool")
const experiments_1 = require("../../../shared/experiments")
// Mock the applyDiffTool module
vi.mock("../applyDiffTool", () => ({
	applyDiffToolLegacy: vi.fn(),
}))
// Import after mocking to get the mocked version
const applyDiffTool_1 = require("../applyDiffTool")
describe("applyDiffTool experiment routing", () => {
	let mockCline
	let mockBlock
	let mockAskApproval
	let mockHandleError
	let mockPushToolResult
	let mockRemoveClosingTag
	let mockProvider
	beforeEach(() => {
		vi.clearAllMocks()
		mockProvider = {
			getState: vi.fn(),
		}
		mockCline = {
			providerRef: {
				deref: vi.fn().mockReturnValue(mockProvider),
			},
			cwd: "/test",
			diffStrategy: {
				applyDiff: vi.fn(),
				getProgressStatus: vi.fn(),
			},
			diffViewProvider: {
				reset: vi.fn(),
			},
			api: {
				getModel: vi.fn().mockReturnValue({ id: "test-model" }),
			},
			processQueuedMessages: vi.fn(),
		}
		mockBlock = {
			params: {
				path: "test.ts",
				diff: "test diff",
			},
			partial: false,
		}
		mockAskApproval = vi.fn()
		mockHandleError = vi.fn()
		mockPushToolResult = vi.fn()
		mockRemoveClosingTag = vi.fn((tag, value) => value)
	})
	it("should use legacy tool when MULTI_FILE_APPLY_DIFF experiment is disabled", async () => {
		mockProvider.getState.mockResolvedValue({
			experiments: {
				[experiments_1.EXPERIMENT_IDS.MULTI_FILE_APPLY_DIFF]: false,
			},
		})
		applyDiffTool_1.applyDiffToolLegacy.mockResolvedValue(undefined)
		await (0, multiApplyDiffTool_1.applyDiffTool)(
			mockCline,
			mockBlock,
			mockAskApproval,
			mockHandleError,
			mockPushToolResult,
			mockRemoveClosingTag,
		)
		expect(applyDiffTool_1.applyDiffToolLegacy).toHaveBeenCalledWith(
			mockCline,
			mockBlock,
			mockAskApproval,
			mockHandleError,
			mockPushToolResult,
			mockRemoveClosingTag,
		)
	})
	it("should use legacy tool when experiments are not defined", async () => {
		mockProvider.getState.mockResolvedValue({})
		applyDiffTool_1.applyDiffToolLegacy.mockResolvedValue(undefined)
		await (0, multiApplyDiffTool_1.applyDiffTool)(
			mockCline,
			mockBlock,
			mockAskApproval,
			mockHandleError,
			mockPushToolResult,
			mockRemoveClosingTag,
		)
		expect(applyDiffTool_1.applyDiffToolLegacy).toHaveBeenCalledWith(
			mockCline,
			mockBlock,
			mockAskApproval,
			mockHandleError,
			mockPushToolResult,
			mockRemoveClosingTag,
		)
	})
	it("should use new tool when MULTI_FILE_APPLY_DIFF experiment is enabled", async () => {
		mockProvider.getState.mockResolvedValue({
			experiments: {
				[experiments_1.EXPERIMENT_IDS.MULTI_FILE_APPLY_DIFF]: true,
			},
		})
		// Mock the new tool behavior - it should continue with the new implementation
		// Since we're not mocking the entire function, we'll just verify it doesn't call legacy
		await (0, multiApplyDiffTool_1.applyDiffTool)(
			mockCline,
			mockBlock,
			mockAskApproval,
			mockHandleError,
			mockPushToolResult,
			mockRemoveClosingTag,
		)
		expect(applyDiffTool_1.applyDiffToolLegacy).not.toHaveBeenCalled()
	})
	it("should use new tool when provider is not available", async () => {
		mockCline.providerRef.deref.mockReturnValue(null)
		await (0, multiApplyDiffTool_1.applyDiffTool)(
			mockCline,
			mockBlock,
			mockAskApproval,
			mockHandleError,
			mockPushToolResult,
			mockRemoveClosingTag,
		)
		// When provider is null, it should continue with new implementation (not call legacy)
		expect(applyDiffTool_1.applyDiffToolLegacy).not.toHaveBeenCalled()
	})
})
//# sourceMappingURL=applyDiffTool.experiment.spec.js.map
