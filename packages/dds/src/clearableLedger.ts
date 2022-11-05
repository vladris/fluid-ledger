import {
    IChannelAttributes,
    IFluidDataStoreRuntime,
    IChannelFactory
} from "@fluidframework/datastore-definitions";
import { IClearableLedger, IClearableLedgerEvents } from "./interfaces";
import { LedgerFactory } from "./ledgerFactory";
import { IAppendOperation, Ledger } from "./ledger";

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
    extends Ledger<T, IClearableLedgerEvents<T>>
    implements IClearableLedger<T>
{
    public static readonly Type: string = "fluid-clearable-ledger-dds";

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
        this.invokeOp({ type: "clear" });
    }

    protected handleOp(op: IClearableLedgerOperation): void {
        switch (op.type) {
            case "clear":
                this.emit("clear", this.data);
                this.data = [];
                break;

            default:
                super.handleOp(op);
        }
    }
}
