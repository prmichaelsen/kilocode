"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.experiments = exports.experimentDefault = exports.experimentConfigsMap = exports.EXPERIMENT_IDS = void 0
exports.EXPERIMENT_IDS = {
	MORPH_FAST_APPLY: "morphFastApply", // kilocode_change
	MULTI_FILE_APPLY_DIFF: "multiFileApplyDiff",
	POWER_STEERING: "powerSteering",
	PREVENT_FOCUS_DISRUPTION: "preventFocusDisruption",
	IMAGE_GENERATION: "imageGeneration",
	RUN_SLASH_COMMAND: "runSlashCommand",
}
exports.experimentConfigsMap = {
	MORPH_FAST_APPLY: { enabled: false }, // kilocode_change
	MULTI_FILE_APPLY_DIFF: { enabled: false },
	POWER_STEERING: { enabled: false },
	PREVENT_FOCUS_DISRUPTION: { enabled: false },
	IMAGE_GENERATION: { enabled: false },
	RUN_SLASH_COMMAND: { enabled: false },
}
exports.experimentDefault = Object.fromEntries(
	Object.entries(exports.experimentConfigsMap).map(([_, config]) => [exports.EXPERIMENT_IDS[_], config.enabled]),
)
exports.experiments = {
	get: (id) => exports.experimentConfigsMap[id],
	isEnabled: (experimentsConfig, id) => experimentsConfig[id] ?? exports.experimentDefault[id],
}
//# sourceMappingURL=experiments.js.map
