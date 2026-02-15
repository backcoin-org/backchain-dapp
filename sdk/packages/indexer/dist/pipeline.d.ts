import type { BaseEvent, ParsedEvent } from '@backchain/events';
/** A pipeline stage that can filter or transform events. Return null to drop. */
export type PipelineStage<T extends BaseEvent = BaseEvent> = (event: T) => T | null | Promise<T | null>;
/** Event handler callback. */
export type EventHandler<T extends BaseEvent = BaseEvent> = (event: T) => void | Promise<void>;
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
export declare class EventPipeline<T extends BaseEvent = BaseEvent> {
    private handler;
    private stages;
    constructor(handler: EventHandler<T>);
    /** Add a filter/transform stage. */
    use(stage: PipelineStage<T>): this;
    /** Process a batch of parsed events through the pipeline. */
    process(events: ParsedEvent<T>[]): Promise<void>;
}
//# sourceMappingURL=pipeline.d.ts.map