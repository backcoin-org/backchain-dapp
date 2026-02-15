/** Persistent block number tracker for resumable indexing. */
export interface CheckpointStore {
    get(key: string): Promise<number | null>;
    set(key: string, blockNumber: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
/** In-memory checkpoint (resets on restart). */
export declare class InMemoryCheckpoint implements CheckpointStore {
    private data;
    get(key: string): Promise<number | null>;
    set(key: string, blockNumber: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
/** File-based checkpoint (persists across restarts). */
export declare class FileCheckpoint implements CheckpointStore {
    private filePath;
    constructor(filePath: string);
    get(key: string): Promise<number | null>;
    set(key: string, blockNumber: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    private _load;
}
//# sourceMappingURL=checkpoint.d.ts.map