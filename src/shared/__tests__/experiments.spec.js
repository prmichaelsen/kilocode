"use strict"
// npx vitest run src/shared/__tests__/experiments.spec.ts
Object.defineProperty(exports, "__esModule", { value: true })
const experiments_1 = require("../experiments")
describe("experiments", () => {
	describe("POWER_STEERING", () => {
		it("is configured correctly", () => {
			expect(experiments_1.EXPERIMENT_IDS.POWER_STEERING).toBe("powerSteering")
			expect(experiments_1.experimentConfigsMap.POWER_STEERING).toMatchObject({
				enabled: false,
			})
		})
	})
	describe("MULTI_FILE_APPLY_DIFF", () => {
		it("is configured correctly", () => {
			expect(experiments_1.EXPERIMENT_IDS.MULTI_FILE_APPLY_DIFF).toBe("multiFileApplyDiff")
			expect(experiments_1.experimentConfigsMap.MULTI_FILE_APPLY_DIFF).toMatchObject({
				enabled: false,
			})
		})
	})
	describe("isEnabled", () => {
		it("returns false when POWER_STEERING experiment is not enabled", () => {
			const experiments = {
				morphFastApply: false, // kilocode_change
				powerSteering: false,
				multiFileApplyDiff: false,
				preventFocusDisruption: false,
				imageGeneration: false,
				runSlashCommand: false,
			}
			expect(experiments_1.experiments.isEnabled(experiments, experiments_1.EXPERIMENT_IDS.POWER_STEERING)).toBe(
				false,
			)
		})
		it("returns true when experiment POWER_STEERING is enabled", () => {
			const experiments = {
				morphFastApply: false, // kilocode_change
				powerSteering: true,
				multiFileApplyDiff: false,
				preventFocusDisruption: false,
				imageGeneration: false,
				runSlashCommand: false,
			}
			expect(experiments_1.experiments.isEnabled(experiments, experiments_1.EXPERIMENT_IDS.POWER_STEERING)).toBe(
				true,
			)
		})
		it("returns false when experiment is not present", () => {
			const experiments = {
				morphFastApply: false, // kilocode_change
				powerSteering: false,
				multiFileApplyDiff: false,
				preventFocusDisruption: false,
				imageGeneration: false,
				runSlashCommand: false,
			}
			expect(experiments_1.experiments.isEnabled(experiments, experiments_1.EXPERIMENT_IDS.POWER_STEERING)).toBe(
				false,
			)
		})
	})
})
//# sourceMappingURL=experiments.spec.js.map
