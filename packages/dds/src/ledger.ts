import {
    ISequencedDocumentMessage,
    MessageType
} from "@fluidframework/protocol-definitions";
import {
    IChannelAttributes,
    IFluidDataStoreRuntime,
    IChannelStorageService,
    IChannelFactory,
    Serializable
} from "@fluidframework/datastore-definitions";
import { ISummaryTreeWithStats } from "@fluidframework/runtime-definitions";
import { readAndParse } from "@fluidframework/driver-utils";
import {
    createSingleBlobSummary,
    IFluidSerializer,
    SharedObject
} from "@fluidframework/shared-object-base";
import { ILedger, ILedgerEvents } from "./interfaces";
import { LedgerFactory } from "./ledgerFactory";

/**
 * Ledger delta operations - Append or Clear.
 */
type ILedgerOperation = IAppendOperation | IClearOperation;

/**
 * Append operation consists of a value (to be appended to the ledger).
 */
interface IAppendOperation {
    type: "append";
    value: any;
}

/**
 * Clear operation signals clearing the ledger.
 */
interface IClearOperation {
    type: "clear";
}

const snapshotFileName = "header";

/**
 * Ledger DDS represents a distributed append-only list. Clients use the
 * append() API to submit new values.
 *
 * @remarks
 *
 * We rely on the service-side sequencing to guarantee consistent ordering of
 * items, which means calling append() locally does not update the underlying
 * list until the we get the op back from the service.
 */
export class Ledger<T = any>
    extends SharedObject<ILedgerEvents<T>>
    implements ILedger<T>
{
    /**
     * Creates a new Ledger.
     *
     * @param runtime - data store runtime the ledger belongs to.
     * @param id - optional name.
     * @returns newly crated ledger (not attached yet).
     */
    public static create(runtime: IFluidDataStoreRuntime, id?: string) {
        return runtime.createChannel(id, LedgerFactory.Type) as Ledger;
    }

    /**
     * Gets a factory for Ledger objects.
     *
     * @returns a factory that creates and loads Ledger objects.
     */
    public static getFactory(): IChannelFactory {
        return new LedgerFactory();
    }

    // Internally the ledger is an array of values.
    private data: Serializable<T>[] = [];

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

            this.applyInnerOp(op);
        }
        // If container is detached, we update data right away and emit the append event.
        else {
            this.appendCore(opValue);
        }
    }

    /**
     * Clears the ledger. Actual clear happens only after op is sequenced,
     * wait for the "clear" event before assuming the ledger is clear.
     */
    public clear() {
        // We have very different code paths depending on whether container is attached or not.
        // When attached, we submit the op and only update data once the op gets sequenced.
        if (this.isAttached()) {
            const op: IClearOperation = {
                type: "clear"
            };

            this.applyInnerOp(op);
        }
        // If container is detached, we clear data right away and emit the clear event.
        else {
            this.clearCore();
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
     * Apply inner op.
     *
     * @param content - ILedgerOperation content.
     */
    private applyInnerOp(content: ILedgerOperation) {
        switch (content.type) {
            case "append":
            case "clear":
                // "Applying the op" in our case means just submitting the message.
                // We don't update the actual list until we get the op back from the service.
                this.submitLocalMessage(content);
                break;

            default:
                throw new Error("Unknown operation");
        }
    }

    /**
     * Process a ledger message.
     *
     * @param message - the message to process.
     */
    protected processCore(message: ISequencedDocumentMessage) {
        // For incoming messages, we don't really care which client they come from.
        if (message.type === MessageType.Operation) {
            const op = message.contents as ILedgerOperation;

            switch (op.type) {
                case "append":
                    this.appendCore(op.value);
                    break;
                case "clear":
                    this.clearCore();
                    break;
                default:
                    throw new Error("Unknown operation");
            }
        }
    }

    /**
     * Actually append value to ledger and fire event.
     *
     * @param value - value to append.
     */
    private appendCore(value: Serializable<T>) {
        this.data.push(value);
        this.emit("append", value);
    }

    /**
     * Clear ledger and fire event.
     */
    private clearCore() {
        // Clone ledger
        const data = this.data.slice();

        // Clear data
        this.data = [];

        // Fire "clear" with cloned ledger
        this.emit("clear", data);
    }

    /**
     * Applies a stashed op - not supported for ledger.
     */
    protected applyStashedOp(content: unknown) {
        // We don't support offline mode
        throw Error("Not supported");
    }
}
