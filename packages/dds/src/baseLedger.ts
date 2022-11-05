import {
    IChannelAttributes,
    IFluidDataStoreRuntime,
    IChannelStorageService,
    Serializable
} from "@fluidframework/datastore-definitions";
import { ISummaryTreeWithStats } from "@fluidframework/runtime-definitions";
import { readAndParse } from "@fluidframework/driver-utils";
import {
    createSingleBlobSummary,
    IFluidSerializer,
    ISharedObjectEvents,
    SharedObject
} from "@fluidframework/shared-object-base";
import { ILedger } from "./interfaces";

/**
 * Ledger delta operations.
 */
export type ILedgerOperation = IAppendOperation;

/**
 * Append operation consists of a value (to be appended to the ledger).
 */
export interface IAppendOperation {
    type: "append";
    value: any;
}

const snapshotFileName = "header";

/**
 * Base ledger class implementations derive from.
 */
export abstract class BaseLedger<
        T = any,
        TEvents extends ISharedObjectEvents = ISharedObjectEvents
    >
    extends SharedObject<TEvents>
    implements ILedger<T>
{
    // Internally the ledger is an array of values.
    protected data: Serializable<T>[] = [];

    /**
     * Constructs a new Ledger.
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
     * Appends a value to the ledger. Actual append happens only after op is
     * sequenced, wait for the "append" event before assuming the value is
     * part of the ledger.
     *
     * @param value - value to append to the ledger.
     */
    public append(value: Serializable<T>) {
        const opValue = this.serializer.encode(value, this.handle);

        // We have very different code paths depending on whether container is attached or not.
        // When attached, we submit the op and only update data once the op gets sequenced.
        if (this.isAttached()) {
            const op: IAppendOperation = {
                type: "append",
                value: opValue
            };

            this.submitLocalMessage(op);
        }
        // If container is detached, we update data right away and emit the append event.
        else {
            this.appendCore(opValue);
        }
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
     * @param storage - storage service to hydrate from/
     */
    protected async loadCore(storage: IChannelStorageService): Promise<void> {
        const content = await readAndParse<Serializable<T>[]>(
            storage,
            snapshotFileName
        );
        this.data = this.serializer.decode(content);
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
     * Actually append value to ledger and fire event.
     *
     * @param value - value to append.
     */
    protected appendCore(value: Serializable<T>) {
        this.data.push(value);
        this.emit("append", value);
    }

    /**
     * Applies a stashed op - not supported for ledger.
     */
    protected applyStashedOp(content: unknown) {
        // We don't support offline mode
        throw Error("Not supported");
    }
}
