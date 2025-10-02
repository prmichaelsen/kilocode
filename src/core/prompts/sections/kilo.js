"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.loadEnabledRules = loadEnabledRules
exports.hasAnyToggles = hasAnyToggles
const promises_1 = __importDefault(require("fs/promises"))
const path_1 = __importDefault(require("path"))
const os_1 = __importDefault(require("os"))
const globalFileNames_1 = require("../../../shared/globalFileNames")
/**
 * Get rule files content with toggle state filtering (matches Cline's getRuleFilesTotalContent)
 */
async function getRuleFilesTotalContent(rulesFilePaths, basePath, toggles) {
	const ruleFilesTotalContent = await Promise.all(
		rulesFilePaths.map(async (filePath) => {
			const ruleFilePath = path_1.default.resolve(basePath, filePath)
			const ruleFilePathRelative = path_1.default.relative(basePath, ruleFilePath)
			// Check if this rule is disabled in toggles
			if (ruleFilePath in toggles && toggles[ruleFilePath] === false) {
				return null
			}
			return `${ruleFilePathRelative}\n` + (await promises_1.default.readFile(ruleFilePath, "utf8")).trim()
		}),
	).then((contents) => contents.filter(Boolean).join("\n\n"))
	return ruleFilesTotalContent
}
async function loadEnabledRulesFromDirectory(
	rulesDir,
	toggleState,
	label,
	directoryExists,
	readTextFilesFromDirectory,
) {
	if (!(await directoryExists(rulesDir))) {
		return null
	}
	const files = await readTextFilesFromDirectory(rulesDir)
	if (files.length === 0) {
		return null
	}
	const rulesContent = await getRuleFilesTotalContent(
		files.map((f) => f.filename),
		rulesDir,
		toggleState,
	)
	return rulesContent ? `# ${label} from ${rulesDir}:\n${rulesContent}` : null
}
async function loadEnabledRules(
	cwd,
	localRulesToggleState,
	globalRulesToggleState,
	directoryExists,
	readTextFilesFromDirectory,
) {
	const globalRulesContent = await loadEnabledRulesFromDirectory(
		path_1.default.join(os_1.default.homedir(), globalFileNames_1.GlobalFileNames.kiloRules),
		globalRulesToggleState,
		"Global Rules",
		directoryExists,
		readTextFilesFromDirectory,
	)
	const localRulesContent = await loadEnabledRulesFromDirectory(
		path_1.default.join(cwd, globalFileNames_1.GlobalFileNames.kiloRules),
		localRulesToggleState,
		"Local Rules",
		directoryExists,
		readTextFilesFromDirectory,
	)
	return [globalRulesContent, localRulesContent].filter(Boolean).join("\n\n")
}
function hasAnyToggles(toggles) {
	return Object.keys(toggles ?? {}).length > 0
}
//# sourceMappingURL=kilo.js.map
