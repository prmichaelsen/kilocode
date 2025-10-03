export interface XmlMatcherResult {
    matched: boolean;
    data: string;
}
export declare class XmlMatcher<Result = XmlMatcherResult> {
    readonly tagName: string;
    readonly transform?: (chunks: XmlMatcherResult) => Result;
    readonly position: number;
    index: number;
    chunks: XmlMatcherResult[];
    cached: string[];
    matched: boolean;
    state: "TEXT" | "TAG_OPEN" | "TAG_CLOSE";
    depth: number;
    pointer: number;
    constructor(tagName: string, transform?: (chunks: XmlMatcherResult) => Result, position?: number);
    private collect;
    private pop;
    private _update;
    final(chunk?: string): Result[];
    update(chunk: string): Result[];
}
//# sourceMappingURL=xml-matcher.d.ts.map