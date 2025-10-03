import type { Keys, ExperimentId, Experiments } from "@roo-code/types";
export declare const EXPERIMENT_IDS: {
    readonly MORPH_FAST_APPLY: "morphFastApply";
    readonly MULTI_FILE_APPLY_DIFF: "multiFileApplyDiff";
    readonly POWER_STEERING: "powerSteering";
    readonly PREVENT_FOCUS_DISRUPTION: "preventFocusDisruption";
    readonly IMAGE_GENERATION: "imageGeneration";
    readonly RUN_SLASH_COMMAND: "runSlashCommand";
};
type ExperimentKey = Keys<typeof EXPERIMENT_IDS>;
interface ExperimentConfig {
    enabled: boolean;
}
export declare const experimentConfigsMap: Record<ExperimentKey, ExperimentConfig>;
export declare const experimentDefault: Record<ExperimentId, boolean>;
export declare const experiments: {
    readonly get: (id: ExperimentKey) => ExperimentConfig | undefined;
    readonly isEnabled: (experimentsConfig: Partial<Experiments>, id: ExperimentId) => boolean;
};
export {};
//# sourceMappingURL=experiments.d.ts.map