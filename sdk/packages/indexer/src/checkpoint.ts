import { readFile, writeFile } from 'node:fs/promises';

/** Persistent block number tracker for resumable indexing. */
export interface CheckpointStore {
    get(key: string): Promise<number | null>;
    set(key: string, blockNumber: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}

/** In-memory checkpoint (resets on restart). */
export class InMemoryCheckpoint implements CheckpointStore {
    private data = new Map<string, number>();

    async get(key: string): Promise<number | null> {
        return this.data.get(key) ?? null;
    }

    async set(key: string, blockNumber: number): Promise<void> {
        this.data.set(key, blockNumber);
    }

    async delete(key: string): Promise<void> {
        this.data.delete(key);
    }

    async clear(): Promise<void> {
        this.data.clear();
    }
}

/** File-based checkpoint (persists across restarts). */
export class FileCheckpoint implements CheckpointStore {
    constructor(private filePath: string) {}

    async get(key: string): Promise<number | null> {
        const data = await this._load();
        return data[key] ?? null;
    }

    async set(key: string, blockNumber: number): Promise<void> {
        const data = await this._load();
        data[key] = blockNumber;
        await writeFile(this.filePath, JSON.stringify(data, null, 2));
    }

    async delete(key: string): Promise<void> {
        const data = await this._load();
        delete data[key];
        await writeFile(this.filePath, JSON.stringify(data, null, 2));
    }

    async clear(): Promise<void> {
        await writeFile(this.filePath, '{}');
    }

    private async _load(): Promise<Record<string, number>> {
        try {
            return JSON.parse(await readFile(this.filePath, 'utf-8'));
        } catch {
            return {};
        }
    }
}
