/**
 * Processes parsed events through optional filter/transform stages before calling the handler.
 *
 * @example
 * ```ts
 * const pipeline = new EventPipeline<DelegatedEvent>(async (event) => {
 *   await db.insert('delegations', event.args);
 * });
 *
 * // Only index delegations > 1000 BKC
 * pipeline.use((event) =>
 *   event.args.amount > ethers.parseEther('1000') ? event : null
 * );
 * ```
 */
export class EventPipeline {
    handler;
    stages = [];
    constructor(handler) {
        this.handler = handler;
    }
    /** Add a filter/transform stage. */
    use(stage) {
        this.stages.push(stage);
        return this;
    }
    /** Process a batch of parsed events through the pipeline. */
    async process(events) {
        for (const { parsed: event } of events) {
            let current = event;
            for (const stage of this.stages) {
                if (!current)
                    break;
                current = await stage(current);
            }
            if (current) {
                await this.handler(current);
            }
        }
    }
}
//# sourceMappingURL=pipeline.js.map