import { readFile, writeFile } from 'node:fs/promises';
/** In-memory checkpoint (resets on restart). */
export class InMemoryCheckpoint {
    data = new Map();
    async get(key) {
        return this.data.get(key) ?? null;
    }
    async set(key, blockNumber) {
        this.data.set(key, blockNumber);
    }
    async delete(key) {
        this.data.delete(key);
    }
    async clear() {
        this.data.clear();
    }
}
/** File-based checkpoint (persists across restarts). */
export class FileCheckpoint {
    filePath;
    constructor(filePath) {
        this.filePath = filePath;
    }
    async get(key) {
        const data = await this._load();
        return data[key] ?? null;
    }
    async set(key, blockNumber) {
        const data = await this._load();
        data[key] = blockNumber;
        await writeFile(this.filePath, JSON.stringify(data, null, 2));
    }
    async delete(key) {
        const data = await this._load();
        delete data[key];
        await writeFile(this.filePath, JSON.stringify(data, null, 2));
    }
    async clear() {
        await writeFile(this.filePath, '{}');
    }
    async _load() {
        try {
            return JSON.parse(await readFile(this.filePath, 'utf-8'));
        }
        catch {
            return {};
        }
    }
}
//# sourceMappingURL=checkpoint.js.map