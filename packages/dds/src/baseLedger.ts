import {
    IChannelAttributes,
    IFluidDataStoreRuntime,
    IChannelStorageService,
    Serializable
} from "@fluidframework/datastore-definitions";
import {
    ISequencedDocumentMessage,
    MessageType
} from "@fluidframework/protocol-definitions";
import { ISummaryTreeWithStats } from "@fluidframework/runtime-definitions";
import { readAndParse } from "@fluidframework/driver-utils";
import {
    createSingleBlobSummary,
    IFluidSerializer,
    ISharedObjectEvents,
    SharedObject
} from "@fluidframework/shared-object-base";

const snapshotFileName = "header";

/**
 * Base ledger class from which ledger implementations derive.
 */
export abstract class BaseLedger<
    T = any,
    TEvents extends ISharedObjectEvents = ISharedObjectEvents
> extends SharedObject<TEvents> {
    // Internally the ledger is an array of values.
    protected data: Serializable<T>[] = [];

    /**
     * Constructs a new BaseLedger.
     *
     * @param id - optional name.
     * @param runtime - data store runtime the ledger belongs to.
     * @param attributes - channel attributes.
     */
    constructor(
        id: string,
        runtime: IFluidDataStoreRuntime,
        attributes: IChannelAttributes
    ) {
        super(id, runtime, attributes, "fluid_ledger_");
    }

    /**
     * Gets an iterable iterator over the ledger.
     *
     * @returns - iterable iterator.
     */
    public get(): IterableIterator<Serializable<T>> {
        return this.data[Symbol.iterator]();
    }

    /**
     * Creates a summary for the ledger.
     *
     * @param serializer - Fluid serializer.
     * @returns summary of ledger.
     */
    protected summarizeCore(
        serializer: IFluidSerializer
    ): ISummaryTreeWithStats {
        return createSingleBlobSummary(
            snapshotFileName,
            serializer.stringify(this.data, this.handle)
        );
    }

    /**
     * Loads ledger data from storage.
     *
     * @param storage - storage service to hydrate from.
     */
    protected async loadCore(storage: IChannelStorageService): Promise<void> {
        const content = await readAndParse<Serializable<T>[]>(
            storage,
            snapshotFileName
        );
        this.data = this.serializer.decode(content);
    }

    // Actual op handling is implemented by derived classes.
    protected abstract handleOp(op: { type: string }): void;

    protected invokeOp(op: { type: string }) {
        // We have very different code paths depending on whether container is attached or not.
        // If attached, submit op and wait for it to be sequenced.
        if (this.isAttached()) {
            this.submitLocalMessage(op);
        }
        // If container is detached, we update data right away.
        else {
            this.handleOp(op);
        }
    }

    /**
     * Process a ledger message.
     *
     * @param message - the message to process.
     */
    protected processCore(message: ISequencedDocumentMessage) {
        if (message.type === MessageType.Operation) {
            const op = message.contents as { type: string };

            this.handleOp(op);
        }
    }

    /**
     * Initialize local data.
     */
    protected initializeLocalCore() {
        this.data = [];
    }

    /**
     * Callback on disconnect.
     */
    protected onDisconnect() {}

    /**
     * Applies a stashed op - not supported for ledger.
     */
    protected applyStashedOp(content: unknown) {
        // We don't support offline mode
        throw Error("Not supported");
    }
}
