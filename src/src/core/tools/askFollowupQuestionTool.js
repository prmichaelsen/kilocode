import { formatResponse } from "../prompts/responses";
import { parseXml } from "../../utils/xml";
export async function askFollowupQuestionTool(cline, block, askApproval, handleError, pushToolResult, removeClosingTag) {
    const question = block.params.question;
    const follow_up = block.params.follow_up;
    try {
        if (block.partial) {
            await cline.ask("followup", removeClosingTag("question", question), block.partial).catch(() => { });
            return;
        }
        else {
            if (!question) {
                cline.consecutiveMistakeCount++;
                cline.recordToolError("ask_followup_question");
                pushToolResult(await cline.sayAndCreateMissingParamError("ask_followup_question", "question"));
                return;
            }
            let follow_up_json = {
                question,
                suggest: [],
            };
            if (follow_up) {
                let parsedSuggest;
                try {
                    parsedSuggest = parseXml(follow_up, ["suggest"]);
                }
                catch (error) {
                    cline.consecutiveMistakeCount++;
                    cline.recordToolError("ask_followup_question");
                    await cline.say("error", `Failed to parse operations: ${error.message}`);
                    pushToolResult(formatResponse.toolError("Invalid operations xml format"));
                    return;
                }
                const rawSuggestions = Array.isArray(parsedSuggest?.suggest)
                    ? parsedSuggest.suggest
                    : [parsedSuggest?.suggest].filter((sug) => sug !== undefined);
                // Transform parsed XML to our Suggest format
                const normalizedSuggest = rawSuggestions.map((sug) => {
                    if (typeof sug === "string") {
                        // Simple string suggestion (no mode attribute)
                        return { answer: sug };
                    }
                    else {
                        // XML object with text content and optional mode attribute
                        const result = { answer: sug["#text"] };
                        if (sug["@_mode"]) {
                            result.mode = sug["@_mode"];
                        }
                        return result;
                    }
                });
                follow_up_json.suggest = normalizedSuggest;
            }
            cline.consecutiveMistakeCount = 0;
            const { text, images } = await cline.ask("followup", JSON.stringify(follow_up_json), false);
            await cline.say("user_feedback", text ?? "", images);
            pushToolResult(formatResponse.toolResult(`<answer>\n${text}\n</answer>`, images));
            return;
        }
    }
    catch (error) {
        await handleError("asking question", error);
        return;
    }
}
//# sourceMappingURL=askFollowupQuestionTool.js.map