import { Ignore } from "ignore";
import { ICodeParser, IEmbedder, IVectorStore, IDirectoryScanner } from "../interfaces";
import { CacheManager } from "../cache-manager";
export declare class DirectoryScanner implements IDirectoryScanner {
    private readonly embedder;
    private readonly qdrantClient;
    private readonly codeParser;
    private readonly cacheManager;
    private readonly ignoreInstance;
    private _cancelled;
    private readonly batchSegmentThreshold;
    constructor(embedder: IEmbedder, qdrantClient: IVectorStore, codeParser: ICodeParser, cacheManager: CacheManager, ignoreInstance: Ignore, batchSegmentThreshold?: number);
    /**
     * Request cooperative cancellation of any in-flight scanning work.
     * The scanDirectory and batch operations periodically check this flag
     * and will exit as soon as practical.
     */
    cancel(): void;
    get isCancelled(): boolean;
    /**
     * Recursively scans a directory for code blocks in supported files.
     * @param directoryPath The directory to scan
     * @param rooIgnoreController Optional RooIgnoreController instance for filtering
     * @param context VS Code ExtensionContext for cache storage
     * @param onError Optional error handler callback
     * @returns Promise<{codeBlocks: CodeBlock[], stats: {processed: number, skipped: number}}> Array of parsed code blocks and processing stats
     */
    scanDirectory(directory: string, onError?: (error: Error) => void, onBlocksIndexed?: (indexedCount: number) => void, onFileParsed?: (fileBlockCount: number) => void): Promise<{
        stats: {
            processed: number;
            skipped: number;
        };
        totalBlockCount: number;
    }>;
    private processBatch;
}
//# sourceMappingURL=scanner.d.ts.map