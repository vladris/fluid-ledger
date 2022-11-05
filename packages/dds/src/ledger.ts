import {
    ISequencedDocumentMessage,
    MessageType
} from "@fluidframework/protocol-definitions";
import { ISharedObjectEvents } from "@fluidframework/shared-object-base";
import {
    IChannelAttributes,
    IFluidDataStoreRuntime,
    IChannelFactory,
    Serializable
} from "@fluidframework/datastore-definitions";
import { ILedgerEvents } from "./interfaces";
import { LedgerFactory } from "./ledgerFactory";
import { BaseLedger, ILedgerOperation } from "./baseLedger";

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
export class Ledger<
    T = any,
    TEvents extends ISharedObjectEvents = ILedgerEvents<T>
> extends BaseLedger<T, TEvents> {
    public static readonly Type = "fluid-ledger-dds";

    /**
     * Creates a new Ledger.
     *
     * @param runtime - data store runtime the ledger belongs to.
     * @param id - optional name.
     * @returns newly crated ledger (not attached yet).
     */
    public static create(runtime: IFluidDataStoreRuntime, id?: string) {
        return runtime.createChannel(id, Ledger.Type) as Ledger;
    }

    /**
     * Gets a factory for Ledger objects.
     *
     * @returns a factory that creates and loads Ledger objects.
     */
    public static getFactory(): IChannelFactory {
        return new LedgerFactory(Ledger);
    }

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
        super(id, runtime, attributes);
    }

    /**
     * Process a ledger message.
     *
     * @param message - the message to process.
     */
    protected processCore(message: ISequencedDocumentMessage) {
        // For incoming messages, we don't really care which client they come from.
        // We append them to the list in the order they arrive and emit "append" events for each.
        if (message.type === MessageType.Operation) {
            const op = message.contents as ILedgerOperation;
            this.appendCore(op.value);
        }
    }
}
