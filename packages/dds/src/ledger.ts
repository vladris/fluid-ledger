import {
    IChannelAttributes,
    IFluidDataStoreRuntime,
    IChannelFactory,
    Serializable
} from "@fluidframework/datastore-definitions";
import { ISharedObjectEvents } from "@fluidframework/shared-object-base";
import { ILedger, ILedgerEvents } from "./interfaces";
import { LedgerFactory } from "./ledgerFactory";
import { BaseLedger } from "./baseLedger";

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
    >
    extends BaseLedger<T, TEvents>
    implements ILedger<T>
{
    public static readonly Type: string = "fluid-ledger-dds";

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
     * Appends a value to the ledger. Actual append happens only after op is
     * sequenced, wait for the "append" event before assuming the value is
     * part of the ledger.
     *
     * @param value - value to append to the ledger.
     */
    public append(value: Serializable<T>) {
        const op: IAppendOperation = {
            type: "append",
            value: this.serializer.encode(value, this.handle)
        };

        this.invokeOp(op);
    }

    protected handleOp(op: ILedgerOperation): void {
        switch (op.type) {
            case "append":
                this.data.push(op.value);
                this.emit("append", op.value);
                break;

            default:
                throw new Error(`Unsupported op type ${op.type}`);
        }
    }
}
