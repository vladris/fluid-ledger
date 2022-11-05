import {
    ISequencedDocumentMessage,
    MessageType
} from "@fluidframework/protocol-definitions";
import {
    IChannelAttributes,
    IFluidDataStoreRuntime,
    IChannelFactory
} from "@fluidframework/datastore-definitions";
import { IClearableLedger, IClearableLedgerEvents } from "./interfaces";
import { LedgerFactory } from "./ledgerFactory";
import { BaseLedger, IAppendOperation } from "./baseLedger";

/**
 * ClearableLedger delta operations - Append or Clear.
 */
type IClearableLedgerOperation = IAppendOperation | IClearOperation;

/**
 * Clear operation clears the ledger.
 */
interface IClearOperation {
    type: "clear";
}

/**
 * ClearableLedger DDS represents a distributed append-only list. Clients use
 * the append() API to submit new values and the clear() API to clear the
 * ledger.
 */
export class ClearableLedger<T = any>
    extends BaseLedger<T, IClearableLedgerEvents<T>>
    implements IClearableLedger<T>
{
    public static readonly Type = "fluid-clearable-ledger-dds";

    /**
     * Creates a new ClearableLedger.
     *
     * @param runtime - data store runtime the ledger belongs to.
     * @param id - optional name.
     * @returns newly crated ledger (not attached yet).
     */
    public static create(runtime: IFluidDataStoreRuntime, id?: string) {
        return runtime.createChannel(
            id,
            ClearableLedger.Type
        ) as ClearableLedger;
    }

    /**
     * Gets a factory for ClearableLedger objects.
     *
     * @returns a factory that creates and loads Ledger objects.
     */
    public static getFactory(): IChannelFactory {
        return new LedgerFactory(ClearableLedger);
    }

    /**
     * Constructs a new ClearableLedger.
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
     * Clears the ledger. Actual clear happens only after op is sequenced.
     * Wait for "clear" event before assuming ledger is empty.
     */
    public clear() {
        // When attached, we submit the op and only update data once the op gets sequenced.
        if (this.isAttached()) {
            const op: IClearOperation = {
                type: "clear"
            };

            this.submitLocalMessage(op);
        }
        // If container is detached, we update data right away.
        else {
            this.clearCore();
        }
    }

    /**
     * Process a ledger message.
     *
     * @param message - the message to process.
     */
    protected override processCore(message: ISequencedDocumentMessage) {
        // For incoming messages, we don't really care which client they come from.
        if (message.type === MessageType.Operation) {
            const op = message.contents as IClearableLedgerOperation;

            switch (op.type) {
                case "append":
                    this.appendCore(op.value);
                    break;

                case "clear":
                    this.clearCore();
                    break;
            }
        }
    }

    private clearCore() {
        this.emit("clear", this.data);
        this.data = [];
    }
}
